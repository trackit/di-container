import { container } from 'tsyringe';
import { Token } from "./Token";
import { register } from './register';

/**
 * Retrieves a dependency from the container using the provided token.
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
export const inject = <T = unknown>(token: Token<T>): T => {
  if (
    !container.isRegistered(token.symbol) &&
    token.defaultProvider !== undefined
  ) {
    register(token, token.defaultProvider);
  }
  return container.resolve(token.symbol);
};
