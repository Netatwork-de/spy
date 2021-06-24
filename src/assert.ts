export interface Assert {
  strictEqual<TValue>(actual: TValue, expected: TValue, errorMessage: string): void;
  isAbove(actual: number, expected: number, errorMessage: string): void;
  deepStrictEqual<TValue>(actual: TValue, expected: TValue, errorMessage: string): void;
}

export class AssertionFactory {
  private static _assert: Assert | null = null;
  public static configure(assert: Assert): Assert {
    return this._assert = assert;
  }
  public static async configureDefault(): Promise<Assert> {
    return this.configure((await import('chai')).assert)
  }
  public static get assert(): Assert {
    const assert = this._assert;
    if (assert !== null) { return assert; }
    throw new Error('Assertion is not configured for Spy.');
  }
}