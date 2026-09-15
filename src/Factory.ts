/**
 * A factory function that creates an instance of type T.
 *
 * @template T - The type of the instance to create
 * @returns A new instance of type T
 */
export type Factory<T> = () => T;
