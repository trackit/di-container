import { InjectionToken } from "tsyringe";
import type { Provider } from "./Provider";

/**
 * A typed injection token used to register and retrieve dependencies from the container.
 *
 * @template T - The type of the dependency this token represents
 *
 * @example
 * ```typescript
 * const MyServiceToken = new Token<MyService>('MyService');
 * ```
 */
export class Token<T> {
  /** The underlying symbol used for dependency resolution */
  public symbol: InjectionToken<T>;

  /** Optional default provider used when injecting an unregistered token */
  public defaultProvider?: Provider<T>;

  constructor(name: string, defaultProvider?: Provider<T>) {
    this.symbol = Symbol(name);
    this.defaultProvider = defaultProvider;
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
