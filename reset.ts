import { container } from 'tsyringe';

/**
 * Clears all registered dependencies from the container.
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
export const reset = (): void => {
  container.reset();
};
