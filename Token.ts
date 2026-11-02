import type { Provider } from "./Provider";

/**
 * A typed injection token used to register and retrieve dependencies from the container.
 *
 * Each token instance is a unique identity: the container uses the token object
 * itself as the lookup key, so two tokens with the same name are still distinct.
 *
 * @template T - The type of the dependency this token represents
 *
 * @example
 * ```typescript
 * const MyServiceToken = new Token<MyService>('MyService');
 * ```
 */
export class Token<T> {
  /** Human-readable name, used in error messages and for debugging */
  public readonly name: string;

  /** Optional default provider used when injecting an unregistered token */
  public defaultProvider?: Provider<T>;

  /**
   * Phantom field that ties the generic parameter to the instance type.
   * Never assigned at runtime; it only exists so `Token<A>` and `Token<B>`
   * are not structurally interchangeable.
   */
  declare private readonly __type?: T;

  constructor(name: string, defaultProvider?: Provider<T>) {
    this.name = name;
    this.defaultProvider = defaultProvider;
  }

  public toString(): string {
    return `Token(${this.name})`;
  }
}

/**
 * Creates a typed injection token for registering and retrieving dependencies.
 *
 * @template T - The type of the dependency this token represents
 * @param name - A unique name for the token (used for debugging)
 * @param defaultProvider - Optional default provider used when injecting an unregistered token
 * @returns A new Token instance
 *
 * @example
 * ```typescript
 * type Logger = { log: (msg: string) => void };
 *
 * const LoggerToken = createInjectionToken<Logger>('Logger');
 *
 * // With a default class provider
 * const LoggerToken = createInjectionToken<Logger>('Logger', {
 *   useClass: ConsoleLogger
 * });
 *
 * // With a default value provider
 * const ConfigToken = createInjectionToken<Config>('Config', {
 *   useValue: { apiUrl: 'https://api.example.com' }
 * });
 * ```
 */
export const createInjectionToken = <T>(
  name: string,
  defaultProvider?: Provider<T>
): Token<T> => new Token<T>(name, defaultProvider);
