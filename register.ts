import { container, instanceCachingFactory, Lifecycle } from 'tsyringe';
import { DIToken } from './DIToken';
import {
  isClassProvider, isFactoryProvider, isValueProvider, Provider,
} from './Provider';

export const register = <T = any>(token: DIToken<T>, provider: Provider<T>): void => {
  if (container.isRegistered(token.symbol)) {
    throw new Error(`Token ${token.symbol.toString()} is already registered.`);
  }

  if (isClassProvider(provider)) {
    container.register(token.symbol, provider, { lifecycle: Lifecycle.Singleton });
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
