import { Token } from "./Token";
import * as container from "./container";
import type { Provider } from "./Provider";

/**
 * Registers a dependency in the container with the given token and provider.
 *
 * Dependencies cannot be overridden - attempting to register the same token twice will throw an error.
 *
 * - `useClass`: Registers a class, instantiated once on first injection
 * - `useValue`: Registers an existing instance
 * - `useFactory`: Registers a factory function, called once on first injection
 *
 * @template T - The type of the dependency
 * @param token - The injection token for the dependency
 * @param provider - The provider configuration (useClass, useValue, or useFactory)
 * @throws Error if the token is already registered
 *
 * @example
 * ```typescript
 * // Register a class (singleton)
 * register(LoggerToken, { useClass: ConsoleLogger });
 *
 * // Register an instance
 * register(ConfigToken, { useValue: { apiUrl: 'https://api.example.com' } });
 *
 * // Register a factory
 * register(HttpClientToken, {
 *   useFactory: () => new HttpClient(inject(ConfigToken))
 * });
 * ```
 */
export const register = <T = any>(
  token: Token<T>,
  provider: Provider<T>
): void => {
  if (container.has(token)) {
    throw new Error(`Token ${token.name} is already registered.`);
  }

  container.set(token, provider);
};
