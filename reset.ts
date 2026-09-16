import * as container from "./container";

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
  container.clear();
};
