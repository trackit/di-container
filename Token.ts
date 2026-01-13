import { InjectionToken } from "tsyringe";
import type { Provider } from "./Provider";

export class Token<T> {
  public symbol: InjectionToken<T>;

  public defaultProvider?: Provider<T>;

  constructor(name: string, defaultProvider?: Provider<T>) {
    this.symbol = Symbol(name);
    this.defaultProvider = defaultProvider;
  }
}

export const createInjectionToken = <T>(
  name: string,
  defaultProvider?: Provider<T>
): Token<T> => new Token<T>(name, defaultProvider);
