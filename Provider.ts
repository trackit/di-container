import type { Factory } from "./Factory";

/**
 * A provider configuration for registering dependencies.
 * Can be one of: ClassProvider, FactoryProvider, or ValueProvider.
 *
 * @template T - The type of the dependency
 */
export type Provider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>;

/**
 * Provides a pre-instantiated value as the dependency.
 *
 * @template T - The type of the dependency
 *
 * @example
 * ```typescript
 * register(ConfigToken, { useValue: { apiUrl: 'https://api.example.com' } });
 * ```
 */
export type ValueProvider<T> = {
  useValue: T;
};

/**
 * Provides a factory function that creates the dependency.
 * The factory is called once and the result is cached.
 *
 * @template T - The type of the dependency
 *
 * @example
 * ```typescript
 * register(HttpClientToken, {
 *   useFactory: () => new HttpClient(inject(ConfigToken))
 * });
 * ```
 */
export type FactoryProvider<T> = {
  useFactory: Factory<T>;
};

/**
 * Provides a class constructor to be instantiated as a singleton.
 *
 * @template T - The type of the dependency
 *
 * @example
 * ```typescript
 * register(LoggerToken, { useClass: ConsoleLogger });
 * ```
 */
export type ClassProvider<T> = {
  useClass: new () => T;
};

export const isValueProvider = <T>(
  provider: Provider<T>
): provider is ValueProvider<T> =>
  (provider as ValueProvider<T>).useValue !== undefined;
export const isFactoryProvider = <T>(
  provider: Provider<T>
): provider is FactoryProvider<T> =>
  (provider as FactoryProvider<T>).useFactory !== undefined;
export const isClassProvider = <T>(
  provider: Provider<T>
): provider is ClassProvider<T> =>
  (provider as ClassProvider<T>).useClass !== undefined;
