import { InjectionToken } from 'tsyringe';
import { Provider } from './Provider';

export class DIToken<T> {
  public symbol: InjectionToken<T>;

  public defaultProvider?: Provider<T>;

  constructor(name: string, defaultProvider?: Provider<T>) {
    this.symbol = Symbol(name);
    this.defaultProvider = defaultProvider;
  }
}

export const createInjectionToken = <T>(name: string, defaultProvider?: Provider<T>): DIToken<T> => new DIToken<T>(name, defaultProvider);
