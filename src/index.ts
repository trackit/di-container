export { Token, createInjectionToken } from "./Token";
export { Container } from "./Container";

export type { Factory } from "./Factory";
export type {
  FactoryProvider,
  ValueProvider,
  ClassProvider,
  Provider,
} from "./Provider";

import { Container } from "./Container";

/**
 * Shared application container. Prefer `register` / `inject` / `reset`
 * unless you need this instance explicitly or a separate `new Container()`.
 */
export const container = new Container();

/**
 * Registers a dependency in the global container with the given token and provider.
 *
 * Dependencies cannot be overridden - attempting to register the same token twice will throw an error.
 *
 * - `useClass`: Registers a class as a singleton
 * - `useValue`: Registers an existing instance
 * - `useFactory`: Registers a factory function (cached after first call)
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
export const register = container.register;

/**
 * Retrieves a dependency from the global container using the provided token.
 *
 * If the token has a default provider and hasn't been registered yet,
 * it will be automatically registered before resolution.
 *
 * @template T - The type of the dependency to retrieve
 * @param token - The injection token for the dependency
 * @returns The resolved dependency instance
 * @throws Error if the token is not registered and has no default provider
 *
 * @example
 * ```typescript
 * // As a class property (recommended pattern)
 * class UserService {
 *   private readonly logger = inject(LoggerToken);
 * }
 *
 * // Direct usage
 * const logger = inject(LoggerToken);
 * logger.log('Hello!');
 * ```
 */
export const inject = container.inject;

/**
 * Clears all registered dependencies from the global container.
 *
 * Useful for testing scenarios where you need to reset the container state between tests.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   reset();
 * });
 * ```
 */
export const reset = container.reset;
