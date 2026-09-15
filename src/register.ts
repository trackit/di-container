import { container, instanceCachingFactory, Lifecycle } from 'tsyringe';
import { Token } from "./Token";
import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
} from "./Provider";
import type { Provider } from "./Provider";

/**
 * Registers a dependency in the container with the given token and provider.
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
export const register = <T = any>(
  token: Token<T>,
  provider: Provider<T>
): void => {
  if (container.isRegistered(token.symbol)) {
    throw new Error(`Token ${token.symbol.toString()} is already registered.`);
  }

  if (isClassProvider(provider)) {
    container.register(token.symbol, provider, {
      lifecycle: Lifecycle.Singleton,
    });
    return;
  }

  if (isValueProvider(provider)) {
    container.register(token.symbol, provider);
    return;
  }

  if (isFactoryProvider(provider)) {
    container.register(token.symbol, {
      useFactory: instanceCachingFactory(provider.useFactory),
    });
  }
};
