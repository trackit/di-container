import { container } from 'tsyringe';
import { Token } from "./Token";
import { register } from './register';

export const inject = <T = unknown>(token: Token<T>): T => {
  if (
    !container.isRegistered(token.symbol) &&
    token.defaultProvider !== undefined
  ) {
    register(token, token.defaultProvider);
  }
  return container.resolve(token.symbol);
};
