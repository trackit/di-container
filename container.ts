import type { Token } from "./Token";
import type { Provider } from "./Provider";
import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
} from "./Provider";

type Entry<T> = {
  provider: Provider<T>;
  resolved: boolean;
  instance?: T;
};

/**
 * The single, process-wide registry backing the container.
 * Tokens are unique object instances, so they serve directly as map keys.
 */
const registry = new Map<Token<unknown>, Entry<unknown>>();

/**
 * Tokens currently being instantiated, in resolution order.
 * Used to detect circular dependencies between providers.
 */
const resolving: Token<unknown>[] = [];

export const has = <T>(token: Token<T>): boolean => registry.has(token);

export const set = <T>(token: Token<T>, provider: Provider<T>): void => {
  registry.set(token, { provider, resolved: false });
};

export const clear = (): void => {
  registry.clear();
  resolving.length = 0;
};

/**
 * Resolves the instance for a token, instantiating it on first access and
 * caching it afterwards (singleton semantics for every provider kind).
 */
export const resolve = <T>(token: Token<T>): T => {
  const entry = registry.get(token) as Entry<T> | undefined;

  if (entry === undefined) {
    throw new Error(
      `Attempted to resolve unregistered token ${token.name}.`
    );
  }

  if (!entry.resolved) {
    if (resolving.includes(token)) {
      const chain = [...resolving, token].map((t) => t.name).join(" -> ");
      throw new Error(`Circular dependency detected: ${chain}.`);
    }

    resolving.push(token);
    try {
      entry.instance = instantiate(entry.provider);
      entry.resolved = true;
    } finally {
      resolving.pop();
    }
  }

  return entry.instance as T;
};

const instantiate = <T>(provider: Provider<T>): T => {
  if (isValueProvider(provider)) {
    return provider.useValue;
  }

  if (isClassProvider(provider)) {
    return new provider.useClass();
  }

  if (isFactoryProvider(provider)) {
    return provider.useFactory();
  }

  throw new Error("Invalid provider: expected useValue, useClass or useFactory.");
};
