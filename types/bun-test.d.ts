/**
 * Type declarations for Bun's built-in test runner
 * 
 * This ambient module declaration provides TypeScript types for the 'bun:test' module
 * that is built into Bun but doesn't ship with its own TypeScript definitions.
 * 
 * Located in types/ directory (not src/) following standard TypeScript convention
 * for ambient declarations and custom type definitions.
 */

declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;

  export interface MockFunction<T extends (...args: any[]) => any = (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockReturnValue(value: ReturnType<T>): MockFunction<T>;
    mockReturnValueOnce(value: ReturnType<T>): MockFunction<T>;
    mockResolvedValue(value: Awaited<ReturnType<T>>): MockFunction<T>;
    mockRejectedValue(value: any): MockFunction<T>;
    mockImplementation(fn: T): MockFunction<T>;
    mockImplementationOnce(fn: T): MockFunction<T>;
    mockReset(): void;
    mockRestore(): void;
    mock: {
      calls: Parameters<T>[];
      results: { type: 'return' | 'throw'; value: any }[];
    };
  }

  export function mock<T extends (...args: any[]) => any>(fn?: T): MockFunction<T>;

  export namespace mock {
    export function module(moduleName: string, factory: () => any): void;
  }

  export interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toContain(expected: any): void;
    toMatch(expected: string | RegExp): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeInstanceOf(expected: any): void;
    toHaveProperty(property: string, value?: any): void;
    toHaveLength(expected: number): void;
    toThrow(expected?: string | RegExp | Error): void;
    not: Matchers<T>;
  }

  export interface AsyncMatchers<T> {
    resolves: Matchers<Awaited<T>>;
    rejects: Matchers<any>;
  }

  export function expect<T>(actual: T): Matchers<T> & (T extends Promise<any> ? AsyncMatchers<T> : {});
}