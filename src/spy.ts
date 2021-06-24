/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-types */
/*! ********************************************************************************
 * Disclaimer:
 * This is implementation of Spy is influenced from Aurelia2's Spy implementation
 * for internal usage.
 * Refer: https://github.com/aurelia/aurelia/blob/master/packages/__tests__/Spy.ts
 ******************************************************************************** */

import { Assert, AssertionFactory } from './assert';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
let assert: Assert = null!;

const noop: () => void = () => { /* noop */ };
export type MethodNames<TObject> = { [Method in keyof TObject]: TObject[Method] extends Function ? Method : never }[keyof TObject];
export type PickOnlyMethods<TObject> = { [Method in MethodNames<TObject>]: TObject[Method] };
export type MethodParameters<TObject, TMethod extends MethodNames<TObject>> = Parameters<PickOnlyMethods<TObject>[TMethod]>;
export type Indexable<TObject> = { [key in keyof TObject]: TObject[key] };
export type ArgumentTransformer<TObject, TMethod extends MethodNames<TObject>> = (
	args: MethodParameters<TObject, TMethod> | MethodParameters<TObject, TMethod>[] | undefined
) => unknown;
const identity: ArgumentTransformer<unknown, never> = (_) => _;

export class Spy<TObject extends object> {

	public static create<TObject extends object, TMethod extends MethodNames<TObject>>(objectToMock: TObject, methodName: TMethod, callThrough: boolean, mockImplementation?: TObject[TMethod]): Spy<TObject>;
	public static create<TObject extends object>(objectToMock: TObject, callThrough: boolean, mockImplementation?: Partial<TObject>): Spy<TObject>;
	public static create<TObject extends object, TMethod extends MethodNames<TObject>>(objectToMock: TObject, ...args: unknown[]): Spy<TObject> {
		let methodName: TMethod;
		let callThrough: boolean;
		let mockImplementation: Partial<TObject> = {};

		switch (args.length) {
			case 3: {
				let methodImpl: TObject[TMethod];
				[methodName, callThrough, methodImpl] = args as [TMethod, boolean, TObject[TMethod]];
				mockImplementation = { [methodName]: methodImpl } as unknown as Partial<TObject>;
				break;
			}
			case 2: {
				const [arg1, arg2] = args as [boolean, Partial<TObject>];
				if (typeof arg1 === 'string' && typeof arg2 === 'boolean') {
					methodName = arg1 as TMethod;
					callThrough = arg2;
				} else if (typeof arg1 === 'boolean') {
					callThrough = arg1;
					mockImplementation = arg2;
				} else {
					throw new Error(`unconsumed arguments: ${String(arg1)}, ${String(arg2)}`);
				}
				break;
			}
			case 1: {
				const arg1 = args[0];
				if (typeof arg1 !== 'boolean') { throw new Error(`unconsumed argument: ${String(arg1)}`); }
				callThrough = arg1;
				break;
			}
			default:
				throw new Error('Unexpected number of arguments');
		}

		assert ??= AssertionFactory.assert;
		return new Spy<TObject>(objectToMock, callThrough, mockImplementation);
	}

	public callRecords = new Map<MethodNames<TObject>, MethodParameters<TObject, MethodNames<TObject>>[]>();
	public readonly proxy: TObject;

	public constructor(
		private readonly originalObject: TObject,
		callThrough: boolean = true,
		mocks: Partial<TObject> = {},
	) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const spy = this;
		this.proxy = new Proxy<TObject>(originalObject, {
			get<TMethod extends MethodNames<TObject>>(target: TObject, p: string | Symbol, _receiver: unknown): unknown {
				const propertyKey = p as keyof TObject;
				const original = (target as Indexable<TObject>)[propertyKey];
				const mock = (mocks as Indexable<TObject>)[propertyKey];
				if (spy.isMethod(original)) {
					if (spy.isMethod(mock)) {
						return spy.createCallRecorder(propertyKey as TMethod, mock);
					}
					return callThrough
						? spy.createCallRecorder(propertyKey as TMethod, original)
						: spy.createCallRecorder(propertyKey as TMethod, noop as TObject[TMethod])
				}
				return mock ?? (callThrough ? original : undefined);
			}
		});
	}

	public callThrough<TMethod extends MethodNames<TObject>>(
		propertyKey: TMethod,
		...args: MethodParameters<TObject, TMethod>
	): ReturnType<TObject[TMethod]> {
		const original = this.originalObject;
		return (original[propertyKey] as Function).apply(original, args);
	}

	/** @internal */
	public createCallRecorder<TMethod extends MethodNames<TObject>>(
		propertyKey: TMethod,
		trapped: TObject[TMethod],
	): (this: TObject, ...args: MethodParameters<TObject, TMethod>) => TObject[TMethod] {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const spy = this;
		return function (this: TObject, ...args: MethodParameters<TObject, TMethod>): TObject[TMethod] {
			spy.setCallRecord(propertyKey, args);
			return (trapped as Function).apply(this, args);
		}
	}

	/** @internal */
	public setCallRecord<TMethod extends MethodNames<TObject>>(methodName: TMethod, args: MethodParameters<TObject, TMethod>): void {
		let record = this.callRecords.get(methodName);
		if (record) {
			record.push(args);
		} else {
			record = [args];
		}
		this.callRecords.set(methodName, record);
	}

	public clearCallRecords(): void { this.callRecords.clear(); }

	public getCallCount(methodName: MethodNames<TObject>): number {
		const calls = this.callRecords.get(methodName);
		return calls?.length ?? 0;
	}

	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod): MethodParameters<TObject, TMethod>[] | undefined;
	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod, callIndex: number): MethodParameters<TObject, TMethod> | undefined;
	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod, callIndex?: number): MethodParameters<TObject, TMethod> | MethodParameters<TObject, TMethod>[] | undefined {
		const calls = this.callRecords.get(methodName);
		if (calls === undefined) { return undefined; }
		if (callIndex !== null && callIndex !== undefined) { return calls[callIndex]; }
		return calls;
	}

	public isCalled(methodName: MethodNames<TObject>, times?: number): void {
		const callCount = this.getCallCount(methodName);
		if (times != null) {
			assert.strictEqual(callCount, times, `call count mismatch for ${String(methodName)}`);
		} else {
			assert.isAbove(callCount, 0, `expected ${String(methodName)} to have been called at least once, but wasn't`);
		}
	}

	public isCalledWith<TMethod extends MethodNames<TObject>>(
		methodName: TMethod,
		expectedArgs: MethodParameters<TObject, TMethod>,
		callIndex: number,
	): void;
	public isCalledWith<TMethod extends MethodNames<TObject>>(
		methodName: TMethod,
		expectedArgs: MethodParameters<TObject, TMethod>[],
	): void;
	public isCalledWith<TMethod extends MethodNames<TObject>>(
		methodName: TMethod,
		expectedArgs: MethodParameters<TObject, TMethod> | MethodParameters<TObject, TMethod>[] | unknown,
		callIndex: number | undefined,
		argsTransformer: ArgumentTransformer<TObject, TMethod>,
	): void;
	public isCalledWith<TMethod extends MethodNames<TObject>>(
		methodName: TMethod,
		expectedArgs: MethodParameters<TObject, TMethod> | MethodParameters<TObject, TMethod>[] | unknown,
		callIndex?: number,
		argsTransformer: ArgumentTransformer<TObject, TMethod> = identity,
	): void {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const actual = argsTransformer(this.getArguments(methodName, callIndex!));
		assert.deepStrictEqual(actual, expectedArgs, `argument mismatch for ${String(methodName)}`);
	}

	private isMethod<TMethod extends MethodNames<TObject>>(arg: unknown): arg is TObject[TMethod] {
		return typeof arg === 'function'
	}
}