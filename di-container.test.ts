import { beforeEach } from '@jest/globals';
import { register } from './register';
import { inject } from './inject';
import { reset } from './reset';
import { createInjectionToken } from "./Token";

type NumberGetter = {
  getNumber: () => number;
};

const NumberGetterToken = createInjectionToken<NumberGetter>('NumberGetterToken');

class OneGetter implements NumberGetter {
  public getNumber(): number {
    return 1;
  }
}

describe('di-container', () => {
  beforeEach(() => {
    reset();
  });

  describe('register', () => {
    describe('basic usage', () => {
      it('should register a dependency through use value', () => {
        register(NumberGetterToken, { useValue: new OneGetter() });

        const getter = inject<NumberGetter>(NumberGetterToken);

        expect(getter.getNumber()).toBe(1);
      });

      it('should register a dependency through use class', () => {
        register(NumberGetterToken, { useClass: OneGetter });

        const getter = inject<NumberGetter>(NumberGetterToken);

        expect(getter.getNumber()).toBe(1);
      });

      it('should register a dependency through use factory', () => {
        register(NumberGetterToken, { useFactory: () => new OneGetter() });

        const getter = inject<NumberGetter>(NumberGetterToken);

        expect(getter.getNumber()).toBe(1);
      });
    });

    describe('internal dependencies', () => {
      class NumberLogger {
        private numberGetter = inject(NumberGetterToken);

        public loggedNumber?: number;

        public logNumber(): void {
          this.loggedNumber = this.numberGetter.getNumber();
        }
      }

      it('should allow injection of dependencies', () => {
        register(NumberGetterToken, { useValue: new OneGetter() });

        const logger = new NumberLogger();

        logger.logNumber();

        expect(logger).toBeDefined();
        expect(logger).toBeInstanceOf(NumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });
    });

    describe('external dependencies', () => {
      class ExternalNumberLogger {
        public loggedNumber?: number;

        constructor(private readonly numberGetter: NumberGetter) {
          this.numberGetter = numberGetter;
        }

        public logNumber(): void {
          this.loggedNumber = this.numberGetter.getNumber();
        }
      }

      const ExternalNumberLoggerToken = createInjectionToken<ExternalNumberLogger>(ExternalNumberLogger.name);

      it('should register an external dependency through use factory with dependencies', () => {
        register(NumberGetterToken, { useValue: new OneGetter() });
        register(ExternalNumberLoggerToken, { useFactory: () => new ExternalNumberLogger(inject(NumberGetterToken)) });

        const logger = inject<ExternalNumberLogger>(ExternalNumberLoggerToken);

        logger.logNumber();

        expect(logger).toBeDefined();
        expect(logger).toBeInstanceOf(ExternalNumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });

      it('should register an external dependency through use value with dependencies', () => {
        register(NumberGetterToken, { useValue: new OneGetter() });
        register(ExternalNumberLoggerToken, { useValue: new ExternalNumberLogger(inject(NumberGetterToken)) });

        const logger = inject<ExternalNumberLogger>(ExternalNumberLoggerToken);

        logger.logNumber();

        expect(logger).toBeDefined();
        expect(logger).toBeInstanceOf(ExternalNumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });
    });

    describe('singleton semantics', () => {
      it('should instantiate a use class provider only once', () => {
        let constructed = 0;

        class CountingGetter implements NumberGetter {
          constructor() {
            constructed++;
          }

          public getNumber(): number {
            return 1;
          }
        }

        register(NumberGetterToken, { useClass: CountingGetter });

        const first = inject(NumberGetterToken);
        const second = inject(NumberGetterToken);

        expect(constructed).toBe(1);
        expect(first).toBe(second);
      });

      it('should call a use factory provider only once', () => {
        const factory = jest.fn(() => new OneGetter());

        register(NumberGetterToken, { useFactory: factory });

        const first = inject(NumberGetterToken);
        const second = inject(NumberGetterToken);

        expect(factory).toHaveBeenCalledTimes(1);
        expect(first).toBe(second);
      });

      it('should not instantiate a use class provider until injected', () => {
        let constructed = 0;

        class LazyGetter implements NumberGetter {
          constructor() {
            constructed++;
          }

          public getNumber(): number {
            return 1;
          }
        }

        register(NumberGetterToken, { useClass: LazyGetter });

        expect(constructed).toBe(0);
      });
    });

    describe('default provider', () => {
      it('should register the default provider on first injection', () => {
        const DefaultedToken = createInjectionToken<NumberGetter>('DefaultedToken', {
          useClass: OneGetter,
        });

        const getter = inject(DefaultedToken);

        expect(getter.getNumber()).toBe(1);
        expect(() => register(DefaultedToken, { useValue: new OneGetter() })).toThrowError();
      });

      it('should prefer an explicit registration over the default provider', () => {
        const DefaultedToken = createInjectionToken<NumberGetter>('DefaultedToken', {
          useClass: OneGetter,
        });

        register(DefaultedToken, { useValue: { getNumber: () => 2 } });

        expect(inject(DefaultedToken).getNumber()).toBe(2);
      });
    });

    describe('token identity', () => {
      it('should treat two tokens with the same name as distinct', () => {
        const First = createInjectionToken<NumberGetter>('Same');
        const Second = createInjectionToken<NumberGetter>('Same');

        register(First, { useValue: { getNumber: () => 1 } });
        register(Second, { useValue: { getNumber: () => 2 } });

        expect(inject(First).getNumber()).toBe(1);
        expect(inject(Second).getNumber()).toBe(2);
      });

      it('should not allow a token of one type where another is expected', () => {
        const StringToken = createInjectionToken<string>('String');

        // @ts-expect-error Token<string> is not assignable to Token<NumberGetter>
        const mismatched: typeof NumberGetterToken = StringToken;

        register(NumberGetterToken, { useValue: new OneGetter() });

        // @ts-expect-error the injected type is inferred from the token
        const wrong: string = inject(NumberGetterToken);

        expect(mismatched).toBe(StringToken);
        expect(wrong).toBeInstanceOf(OneGetter);
      });
    });

    describe('no override', () => {
      it('should throw an error when registering a dependency twice', () => {
        register(NumberGetterToken, { useValue: new OneGetter() });

        expect(() => register(NumberGetterToken, { useValue: new OneGetter() })).toThrowError();
      });
    });
  });

  describe('reset', () => {
    it('should reset the container', () => {
      register(NumberGetterToken, { useValue: new OneGetter() });

      const getter = inject<NumberGetter>(NumberGetterToken);

      reset();

      expect(() => inject<NumberGetter>(NumberGetterToken)).toThrowError();
      expect(getter.getNumber()).toBe(1);
    });
  });
});
