import { FactoryFunction } from './FactoryFunction';

export type Provider<T = any> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

export type ValueProvider<T> = {
  useValue: T;
};

export type FactoryProvider<T> = {
  useFactory: FactoryFunction<T>;
};

export type ClassProvider<T> = {
  useClass: new () => T;
};

export const isValueProvider = <T>(provider: Provider<T>): provider is ValueProvider<T> => (provider as ValueProvider<T>).useValue !== undefined;
export const isFactoryProvider = <T>(provider: Provider<T>): provider is FactoryProvider<T> => (
  (provider as FactoryProvider<T>).useFactory !== undefined
);
export const isClassProvider = <T>(provider: Provider<T>): provider is ClassProvider<T> => (provider as ClassProvider<T>).useClass !== undefined;
