/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssertionError, strict } from 'assert';
import { assert } from 'chai';
import { Assert, AssertionFactory } from '../src/assert';
import { MethodNames, Spy } from '../src/spy';

describe('spy', function () {
  class Sut {
    public constructor(
      private readonly dep: Dependency,
    ) { }

    public doSomething() {
      const dep = this.dep;
      return `${dep.foo()} - ${dep.bar()}`;
    }
    public add(num1: number | NumWrapper, num2: number | NumWrapper) {
      return this.dep.add(num1, num2);
    }
  }
  class Dependency {
    public readonly member: number = 42;
    public get prop(): number { return 42; }
    public foo() {
      return 'real foo';
    }
    public bar() {
      return 'real bar';
    }
    public add(num1: number | NumWrapper, num2: number | NumWrapper) {
      num1 = typeof num1 === 'number' ? num1 : num1.num;
      num2 = typeof num2 === 'number' ? num2 : num2.num;
      return num1 + num2;
    }
    public fizz(_arg0: number, _arg1: NumWrapper, _arg2: string) { /* noop */ }
  }
  class NumWrapper {
    public constructor(public readonly num: number) { }
  }

  const altAssert: Assert = {
    strictEqual: strict.strictEqual,
    deepStrictEqual: strict.deepStrictEqual,
    isAbove(actual, expected, message) {
      if (actual <= expected) {
        throw new AssertionError({ message, actual, expected });
      }
    }
  };

  async function arrange(defaultAssert: boolean) {
    if (defaultAssert) {
      await AssertionFactory.configureDefault();
    } else {
      AssertionFactory.configure(altAssert);
    }
  }

  const $it = function ($name: string, testFunction: () => void | Promise<void>, defaultAssert: boolean) {
    return it($name, async function () {
      await arrange(defaultAssert);
      await testFunction();
    });
  };

  function assertCallRecords(spy: Spy<Dependency>, expected: Partial<Record<MethodNames<Dependency>, [times: number, argsList: any[][]]>>) {
    for (const [m, [times, argsList]] of Object.entries(expected)) {
      const method = m as MethodNames<Dependency>;

      assert.strictEqual(spy.getCallCount(method), times);

      if (times !== 0) {
        spy.isCalled(method);
        spy.isCalled(method, times);
        assert.throws(() => spy.isCalled(method, times - 1));
        assert.throws(() => spy.isCalled(method, times + 1));

        spy.isCalledWith(method, argsList as any);
        assert.throws(() => spy.isCalledWith(method, [[Math.random()]] as any));

        for (let i = 0, ii = argsList.length; i < ii; i++) {
          spy.isCalledWith(method, argsList[i] as any, i);
          assert.throws(() => spy.isCalledWith(method, [Math.random()] as any, i));
        }
      } else {
        spy.isCalled(method, 0);
        assert.throws(() => spy.isCalled(method));
        spy.isCalledWith(method, undefined as any);
        assert.throws(() => spy.isCalledWith(method, [[Math.random()]] as any));
      }
    }
  }

  for (const useDefaultAssert of [true, false]) {
    $it(`without mock implementation - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), false);
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'undefined - undefined');
      assertCallRecords(spy, { foo: [1, [[]]], bar: [1, [[]]] });
    }, useDefaultAssert);

    $it(`with mock implementation - #1 - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), false, { foo() { return 'fake foo'; }, bar() { return 'fake bar'; } });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo - fake bar');
      assertCallRecords(spy, { foo: [1, [[]]], bar: [1, [[]]] });
    }, useDefaultAssert);

    $it(`with mock implementation - #2 - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      let counter = 1;
      const spy = Spy.create(new Dependency(), false, { foo() { return `fake foo#${counter++}`; }, bar() { return 'fake bar'; } });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo#1 - fake bar');
      assert.strictEqual(sut.doSomething(), 'fake foo#2 - fake bar');
      assertCallRecords(spy, { foo: [2, [[], []]], bar: [2, [[], []]] });
    }, useDefaultAssert);

    $it(`with call-through - all - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), true);
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'real foo - real bar');
      assertCallRecords(spy, { foo: [1, [[]]], bar: [1, [[]]] });
    }, useDefaultAssert);

    $it(`with call-through - partial - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), true, { foo() { return 'fake foo'; } });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo - real bar');
      assertCallRecords(spy, { foo: [1, [[]]], bar: [1, [[]]] });
    }, useDefaultAssert);

    $it(`call-through from mock implementation - with call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      let fooCounter = 0, addCounter = 0;
      const spy: Spy<Dependency> = Spy.create(new Dependency(), true, {
        foo() {
          fooCounter++;
          return fooCounter % 2 !== 0 ? `fake foo#${fooCounter}` : spy.callThrough('foo');
        },
        add(num1, num2) {
          addCounter++;
          return addCounter % 2 !== 0 ? ((num1 as number) * (num2 as number)) : spy.callThrough('add', num1, num2);
        }
      });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo#1 - real bar');
      assert.strictEqual(sut.doSomething(), 'real foo - real bar');
      assert.strictEqual(sut.doSomething(), 'fake foo#3 - real bar');
      assert.strictEqual(sut.add(2, 40), 80);
      assert.strictEqual(sut.add(40, 2), 42);
      assertCallRecords(spy, { foo: [3, [[], [], []]], bar: [3, [[], [], []]], add: [2, [[2, 40], [40, 2]]] });
    }, useDefaultAssert);

    $it(`call-through from mock implementation - without call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      let fooCounter = 0, addCounter = 0;
      const spy: Spy<Dependency> = Spy.create(new Dependency(), false, {
        foo() {
          fooCounter++;
          return fooCounter % 2 !== 0 ? `fake foo#${fooCounter}` : spy.callThrough('foo');
        },
        add(num1, num2) {
          addCounter++;
          return addCounter % 2 !== 0 ? ((num1 as number) * (num2 as number)) : spy.callThrough('add', num1, num2);
        }
      });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo#1 - undefined');
      assert.strictEqual(sut.doSomething(), 'real foo - undefined');
      assert.strictEqual(sut.doSomething(), 'fake foo#3 - undefined');
      assert.strictEqual(sut.add(2, 40), 80);
      assert.strictEqual(sut.add(40, 2), 42);
      assertCallRecords(spy, { foo: [3, [[], [], []]], bar: [3, [[], [], []]], add: [2, [[2, 40], [40, 2]]] });
    }, useDefaultAssert);

    $it(`call-through another method from mock implementation - with call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      let counter = 0;
      const spy: Spy<Dependency> = Spy.create(new Dependency(), true, {
        foo() {
          counter++;
          return counter % 2 !== 0 ? `fake foo#${counter}` : spy.callThrough('bar');
        }
      });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo#1 - real bar');
      assert.strictEqual(sut.doSomething(), 'real bar - real bar');
      assert.strictEqual(sut.doSomething(), 'fake foo#3 - real bar');
      assertCallRecords(spy, { foo: [3, [[], [], []]], bar: [3, [[], [], []]] });
    }, useDefaultAssert);

    $it(`call-through another method from mock implementation - without through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      let counter = 0;
      const spy: Spy<Dependency> = Spy.create(new Dependency(), false, {
        foo() {
          counter++;
          return counter % 2 !== 0 ? `fake foo#${counter}` : spy.callThrough('bar');
        }
      });
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.doSomething(), 'fake foo#1 - undefined');
      assert.strictEqual(sut.doSomething(), 'real bar - undefined');
      assert.strictEqual(sut.doSomething(), 'fake foo#3 - undefined');
      assertCallRecords(spy, { foo: [3, [[], [], []]], bar: [3, [[], [], []]] });
    }, useDefaultAssert);

    for (const callThrough of [true, false]) {
      $it(`mocking single method - ${!callThrough ? 'without' : 'with'} call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
        const spy = Spy.create(new Dependency(), 'foo', callThrough, () => 'fake foo');
        const sut = new Sut(spy.proxy);
        assert.strictEqual(sut.doSomething(), callThrough ? 'fake foo - real bar' : 'fake foo - undefined');
        assert.strictEqual(sut.doSomething(), callThrough ? 'fake foo - real bar' : 'fake foo - undefined');
        assertCallRecords(spy, { foo: [2, [[], []]], bar: [2, [[], []]] });
      }, useDefaultAssert);

      $it(`mock member with a constant value - ${!callThrough ? 'without' : 'with'} call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
        const spy = Spy.create(new Dependency(), callThrough, { member: 43 });
        assert.strictEqual(spy.proxy.member, 43);
        assert.strictEqual(spy.proxy.prop, callThrough ? 42 : undefined);
      }, useDefaultAssert);

      $it(`mock property with a constant value - ${!callThrough ? 'without' : 'with'} call-through - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
        const spy = Spy.create(new Dependency(), callThrough, { prop: 43 });
        assert.strictEqual(spy.proxy.member, callThrough ? 42 : undefined);
        assert.strictEqual(spy.proxy.prop, 43);
      }, useDefaultAssert);
    }

    $it(`captures methods arguments correctly - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), true);
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.add(1, 2), 3);
      assert.strictEqual(sut.add(new NumWrapper(1), new NumWrapper(2)), 3);
      const forty = new NumWrapper(40);
      const two = new NumWrapper(2);
      assert.strictEqual(sut.add(forty, two), 42);
      assertCallRecords(spy, { add: [3, [[1, 2], [new NumWrapper(1), new NumWrapper(2)], [forty, two]]] });
    }, useDefaultAssert);

    $it(`captured calls can be cleared - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), true);
      const sut = new Sut(spy.proxy);
      assert.strictEqual(sut.add(1, 2), 3);
      assert.strictEqual(sut.add(new NumWrapper(1), new NumWrapper(2)), 3);
      sut.doSomething();

      assertCallRecords(spy, { add: [2, [[1, 2], [new NumWrapper(1), new NumWrapper(2)]]], foo: [1, [[]]], bar: [1, [[]]] });

      spy.clearCallRecords('foo');
      assertCallRecords(spy, { add: [2, [[1, 2], [new NumWrapper(1), new NumWrapper(2)]]], foo: [0, []], bar: [1, [[]]] });

      spy.clearCallRecords();
      assertCallRecords(spy, { add: [0, []], foo: [0, []], bar: [0, []] });

      const forty = new NumWrapper(40);
      const two = new NumWrapper(2);
      assert.strictEqual(sut.add(forty, two), 42);
      assertCallRecords(spy, { add: [1, [[forty, two]]] });
    }, useDefaultAssert);

    $it(`argument transformer can be used - ${useDefaultAssert ? 'default' : 'custom'} assertion`, function () {
      const spy = Spy.create(new Dependency(), true);

      spy.proxy.fizz(42, new NumWrapper(42), 'forty two');
      spy.isCalledWith(
        'fizz',
        '42 - NW 42 - forty two',
        0,
        (args) => {
          const [arg0, arg1, arg2] = args as [number, NumWrapper, string];
          return `${arg0} - NW ${arg1.num} - ${arg2}`;
        });

      spy.proxy.fizz(43, new NumWrapper(43), 'forty three');
      spy.isCalledWith(
        'fizz',
        '43 | NW 43 | forty three',
        1,
        (args) => {
          const [arg0, arg1, arg2] = args as [number, NumWrapper, string];
          return `${arg0} | NW ${arg1.num} | ${arg2}`;
        });

      spy.isCalledWith(
        'fizz',
        '42 - NW 42 - forty two | 43 - NW 43 - forty three',
        undefined,
        (args) => {
          return (args as [number, NumWrapper, string][]).map(([arg0, arg1, arg2]) => `${arg0} - NW ${arg1.num} - ${arg2}`).join(' | ');
        });
    }, useDefaultAssert);
  }
});