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

        expect(() => register(NumberGetterToken, { useValue: new OneGetter() })).toThrowError(
          'Token NumberGetterToken is already registered.'
        );
      });
    });

    describe('lazy resolution', () => {
      it('should resolve a factory whose dependency is registered later', () => {
        const DoubledToken = createInjectionToken<number>('DoubledToken');

        register(DoubledToken, { useFactory: () => inject(NumberGetterToken).getNumber() * 2 });
        register(NumberGetterToken, { useValue: new OneGetter() });

        expect(inject(DoubledToken)).toBe(2);
      });

      it('should resolve a use class whose properties inject other tokens', () => {
        class NumberLogger {
          private numberGetter = inject(NumberGetterToken);

          public logNumber(): number {
            return this.numberGetter.getNumber();
          }
        }

        const NumberLoggerToken = createInjectionToken<NumberLogger>('NumberLoggerToken');

        register(NumberLoggerToken, { useClass: NumberLogger });
        register(NumberGetterToken, { useValue: new OneGetter() });

        expect(inject(NumberLoggerToken).logNumber()).toBe(1);
      });

      it('should retry a factory that threw on a previous injection', () => {
        let attempts = 0;

        register(NumberGetterToken, {
          useFactory: () => {
            attempts++;
            if (attempts === 1) {
              throw new Error('not ready');
            }
            return new OneGetter();
          },
        });

        expect(() => inject(NumberGetterToken)).toThrowError('not ready');
        expect(inject(NumberGetterToken).getNumber()).toBe(1);
        expect(attempts).toBe(2);
      });

      it('should throw when dependencies are circular', () => {
        const FirstToken = createInjectionToken<number>('FirstToken');
        const SecondToken = createInjectionToken<number>('SecondToken');

        register(FirstToken, { useFactory: () => inject(SecondToken) });
        register(SecondToken, { useFactory: () => inject(FirstToken) });

        expect(() => inject(FirstToken)).toThrowError(
          'Circular dependency detected: FirstToken -> SecondToken -> FirstToken.'
        );
      });

      it('should throw when a use class depends on itself through another token', () => {
        class SelfReferencingGetter implements NumberGetter {
          private other = inject(NumberGetterToken);

          public getNumber(): number {
            return this.other.getNumber();
          }
        }

        register(NumberGetterToken, { useClass: SelfReferencingGetter });

        expect(() => inject(NumberGetterToken)).toThrowError(
          'Circular dependency detected: NumberGetterToken -> NumberGetterToken.'
        );
      });

      it('should recover after a circular dependency error', () => {
        const FirstToken = createInjectionToken<number>('FirstToken');
        const SecondToken = createInjectionToken<number>('SecondToken');

        register(FirstToken, { useFactory: () => inject(SecondToken) });
        register(SecondToken, { useFactory: () => inject(FirstToken) });

        expect(() => inject(FirstToken)).toThrowError('Circular dependency detected');

        reset();
        register(FirstToken, { useValue: 1 });

        expect(inject(FirstToken)).toBe(1);
      });

      it('should not report a cycle for a diamond dependency', () => {
        const LeftToken = createInjectionToken<number>('LeftToken');
        const RightToken = createInjectionToken<number>('RightToken');
        const TopToken = createInjectionToken<number>('TopToken');

        register(NumberGetterToken, { useValue: new OneGetter() });
        register(LeftToken, { useFactory: () => inject(NumberGetterToken).getNumber() });
        register(RightToken, { useFactory: () => inject(NumberGetterToken).getNumber() + 1 });
        register(TopToken, { useFactory: () => inject(LeftToken) + inject(RightToken) });

        expect(inject(TopToken)).toBe(3);
      });
    });

    describe('values', () => {
      it('should resolve falsy values', () => {
        const ZeroToken = createInjectionToken<number>('ZeroToken');
        const EmptyToken = createInjectionToken<string>('EmptyToken');
        const FalseToken = createInjectionToken<boolean>('FalseToken');
        const NullToken = createInjectionToken<null>('NullToken');

        register(ZeroToken, { useValue: 0 });
        register(EmptyToken, { useValue: '' });
        register(FalseToken, { useValue: false });
        register(NullToken, { useValue: null });

        expect(inject(ZeroToken)).toBe(0);
        expect(inject(EmptyToken)).toBe('');
        expect(inject(FalseToken)).toBe(false);
        expect(inject(NullToken)).toBeNull();
      });

      it('should reject an undefined value as an invalid provider', () => {
        const UndefinedToken = createInjectionToken<undefined>('UndefinedToken');

        register(UndefinedToken, { useValue: undefined });

        expect(() => inject(UndefinedToken)).toThrowError('Invalid provider');
      });
    });
  });

  describe('reset', () => {
    it('should reset the container', () => {
      register(NumberGetterToken, { useValue: new OneGetter() });

      const getter = inject<NumberGetter>(NumberGetterToken);

      reset();

      expect(() => inject<NumberGetter>(NumberGetterToken)).toThrowError(
        'Attempted to resolve unregistered token NumberGetterToken.'
      );
      expect(getter.getNumber()).toBe(1);
    });

    it('should allow registering a token again after reset', () => {
      register(NumberGetterToken, { useValue: new OneGetter() });

      reset();
      register(NumberGetterToken, { useValue: { getNumber: () => 2 } });

      expect(inject(NumberGetterToken).getNumber()).toBe(2);
    });

    it('should re-register a default provider on the next injection after reset', () => {
      let constructed = 0;

      class CountingGetter implements NumberGetter {
        constructor() {
          constructed++;
        }

        public getNumber(): number {
          return 1;
        }
      }

      const DefaultedToken = createInjectionToken<NumberGetter>('DefaultedToken', { useClass: CountingGetter });

      inject(DefaultedToken);
      reset();
      inject(DefaultedToken);

      expect(constructed).toBe(2);
    });
  });
});
