# @netatwork/spy

[![npm version](https://img.shields.io/npm/v/@netatwork/spy)](https://www.npmjs.com/package/@netatwork/spy)
[![npm download](https://img.shields.io/npm/dt/@netatwork/spy?label=npm%20download)](https://www.npmjs.com/package/@netatwork/spy)
![build status](https://github.com/Netatwork-de/spy/workflows/build/badge.svg)

Simple proxy-based spy implementation.

```typescript
import { Spy } from '@netatwork/spy';

class Service {
    public getData(): Promise<any> {
        // here we make HTTP requests
    }
}

class Sut {
    public constructor(
        public readonly service: Service
    ) { }
}

const spy = Spy.create(
    /* object to mock       */ new Service(),
    /* call through         */ false,
    /* mock implementations */ {
        getData() {
            return Promise.resolve([]);
        }
    }
);

const sut = new Sut(spy.proxy);
await sut.service.getData();
// assert method call
serviceSpy.isCalled('getData');

// You can also use it to spy a single method.
const spy = Spy.create(
    /* object to mock       */ new Service(),
    /* methodName           */ 'getData',
    /* call through         */ false,
    /* mock implementations */ () => Promise.resolve([]),
);
```

## Acknowledgements

- The original work is highly influenced by the work done for [Aurelia2](https://github.com/aurelia/aurelia).