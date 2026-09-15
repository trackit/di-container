import { Token } from "./Token";
import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
} from "./Provider";
import type { Provider } from "./Provider";
import type { Factory } from "./Factory";

type Registration<T> =
  | { kind: "value"; value: T }
  | { kind: "class"; ctor: new () => T; instance?: T; resolved: boolean }
  | { kind: "factory"; factory: Factory<T>; instance?: T; resolved: boolean };

/**
 * Typesafe dependency injection container.
 *
 * Each instance has its own registrations. Use the exported global `container`
 * (or `register` / `inject` / `reset`) for the shared application container.
 */
export class Container {
  private readonly registrations = new Map<symbol, Registration<unknown>>();
  private readonly resolving = new Set<symbol>();

  /**
   * Registers a dependency with the given token and provider.
   *
   * Dependencies cannot be overridden — registering the same token twice throws.
   *
   * - `useClass`: Instantiated once on first inject (singleton)
   * - `useValue`: Registers an existing instance
   * - `useFactory`: Called once on first inject; result is cached
   */
  public register = <T = unknown>(
    token: Token<T>,
    provider: Provider<T>
  ): void => {
    if (this.registrations.has(token.symbol)) {
      throw new Error(`Token ${token.symbol.toString()} is already registered.`);
    }

    if (isClassProvider(provider)) {
      this.registrations.set(token.symbol, {
        kind: "class",
        ctor: provider.useClass,
        resolved: false,
      });
      return;
    }

    if (isValueProvider(provider)) {
      this.registrations.set(token.symbol, {
        kind: "value",
        value: provider.useValue,
      });
      return;
    }

    if (isFactoryProvider(provider)) {
      this.registrations.set(token.symbol, {
        kind: "factory",
        factory: provider.useFactory,
        resolved: false,
      });
      return;
    }

    throw new Error(`Invalid provider for token ${token.symbol.toString()}.`);
  };

  /**
   * Retrieves a dependency using the provided token.
   *
   * If the token has a default provider and has not been registered yet,
   * it is registered automatically before resolution.
   */
  public inject = <T = unknown>(token: Token<T>): T => {
    if (
      !this.registrations.has(token.symbol) &&
      token.defaultProvider !== undefined
    ) {
      this.register(token, token.defaultProvider);
    }

    const registration = this.registrations.get(token.symbol) as
      | Registration<T>
      | undefined;

    if (registration === undefined) {
      throw new Error(`Token ${token.symbol.toString()} is not registered.`);
    }

    return this.resolve(token.symbol, registration);
  };

  /**
   * Clears all registered dependencies from this container.
   */
  public reset = (): void => {
    this.registrations.clear();
    this.resolving.clear();
  };

  private resolve<T>(symbol: symbol, registration: Registration<T>): T {
    if (registration.kind === "value") {
      return registration.value;
    }

    if (registration.resolved) {
      return registration.instance as T;
    }

    if (this.resolving.has(symbol)) {
      throw new Error(
        `Circular dependency detected for token ${symbol.toString()}.`
      );
    }

    this.resolving.add(symbol);

    try {
      const instance =
        registration.kind === "class"
          ? new registration.ctor()
          : registration.factory();

      registration.instance = instance;
      registration.resolved = true;
      return instance;
    } finally {
      this.resolving.delete(symbol);
    }
  }
}
