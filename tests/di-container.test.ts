import { beforeEach } from '@jest/globals';
import {
  Container,
  container,
  createInjectionToken,
  inject,
  register,
  reset,
  Token,
} from '../src';

type NumberGetter = {
  getNumber: () => number;
};

class OneGetter implements NumberGetter {
  public getNumber(): number {
    return 1;
  }
}

class TwoGetter implements NumberGetter {
  public getNumber(): number {
    return 2;
  }
}

describe('di-container', () => {
  beforeEach(() => {
    reset();
  });

  describe('createInjectionToken', () => {
    it('returns a Token with a unique symbol even when names match', () => {
      const first = createInjectionToken<NumberGetter>('NumberGetter');
      const second = createInjectionToken<NumberGetter>('NumberGetter');

      expect(first).toBeInstanceOf(Token);
      expect(first.symbol).not.toBe(second.symbol);
    });

    it('stores an optional default provider on the token', () => {
      const token = createInjectionToken<NumberGetter>('NumberGetter', {
        useClass: OneGetter,
      });

      expect(token.defaultProvider).toEqual({ useClass: OneGetter });
    });
  });

  describe('register', () => {
    describe('basic usage', () => {
      const NumberGetterToken =
        createInjectionToken<NumberGetter>('NumberGetterToken');

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

    describe('identity and caching', () => {
      it('returns the same instance for useValue', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');
        const instance = new OneGetter();

        register(NumberGetterToken, { useValue: instance });

        expect(inject(NumberGetterToken)).toBe(instance);
        expect(inject(NumberGetterToken)).toBe(instance);
      });

      it('instantiates useClass once (singleton)', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');

        register(NumberGetterToken, { useClass: OneGetter });

        expect(inject(NumberGetterToken)).toBe(inject(NumberGetterToken));
      });

      it('does not call useClass until first inject', () => {
        let constructed = 0;

        class CountingGetter implements NumberGetter {
          constructor() {
            constructed += 1;
          }

          public getNumber(): number {
            return constructed;
          }
        }

        const token = createInjectionToken<NumberGetter>('CountingGetter');
        register(token, { useClass: CountingGetter });

        expect(constructed).toBe(0);
        inject(token);
        inject(token);
        expect(constructed).toBe(1);
      });

      it('calls useFactory once and caches the result', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');
        let calls = 0;

        register(NumberGetterToken, {
          useFactory: () => {
            calls += 1;
            return new OneGetter();
          },
        });

        expect(calls).toBe(0);
        const first = inject(NumberGetterToken);
        const second = inject(NumberGetterToken);

        expect(calls).toBe(1);
        expect(first).toBe(second);
      });

      it('caches a factory result of undefined', () => {
        const token = createInjectionToken<number | undefined>('MaybeNumber');
        let calls = 0;

        register(token, {
          useFactory: () => {
            calls += 1;
            return undefined;
          },
        });

        expect(inject(token)).toBeUndefined();
        expect(inject(token)).toBeUndefined();
        expect(calls).toBe(1);
      });
    });

    describe('falsy useValue', () => {
      it.each([0, false, '', null] as const)(
        'registers useValue %p',
        (value) => {
          const token = createInjectionToken<typeof value>('Falsy');
          register(token, { useValue: value });
          expect(inject(token)).toBe(value);
        }
      );
    });

    describe('provider precedence', () => {
      it('treats a provider with useClass as a class provider even if useValue is also present', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetterToken');

        register(token, {
          useClass: OneGetter,
          useValue: new TwoGetter(),
        } as { useClass: new () => NumberGetter; useValue: NumberGetter });

        expect(inject(token)).toBeInstanceOf(OneGetter);
        expect(inject(token).getNumber()).toBe(1);
      });
    });

    describe('internal dependencies', () => {
      it('should allow injection of dependencies via field initializers', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');

        class NumberLogger {
          private numberGetter = inject(NumberGetterToken);

          public loggedNumber?: number;

          public logNumber(): void {
            this.loggedNumber = this.numberGetter.getNumber();
          }
        }

        register(NumberGetterToken, { useValue: new OneGetter() });

        const logger = new NumberLogger();
        logger.logNumber();

        expect(logger).toBeInstanceOf(NumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });

      it('resolves field inject when the class is created through useClass', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');

        class NumberLogger {
          private numberGetter = inject(NumberGetterToken);

          public logNumber(): number {
            return this.numberGetter.getNumber();
          }
        }

        const NumberLoggerToken =
          createInjectionToken<NumberLogger>('NumberLogger');

        register(NumberGetterToken, { useClass: OneGetter });
        register(NumberLoggerToken, { useClass: NumberLogger });

        expect(inject(NumberLoggerToken).logNumber()).toBe(1);
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

      it('should register an external dependency through use factory with dependencies', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');
        const ExternalNumberLoggerToken =
          createInjectionToken<ExternalNumberLogger>(
            ExternalNumberLogger.name
          );

        register(NumberGetterToken, { useValue: new OneGetter() });
        register(ExternalNumberLoggerToken, {
          useFactory: () =>
            new ExternalNumberLogger(inject(NumberGetterToken)),
        });

        const logger = inject<ExternalNumberLogger>(ExternalNumberLoggerToken);
        logger.logNumber();

        expect(logger).toBeInstanceOf(ExternalNumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });

      it('should register an external dependency through use value with dependencies', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');
        const ExternalNumberLoggerToken =
          createInjectionToken<ExternalNumberLogger>(
            ExternalNumberLogger.name
          );

        register(NumberGetterToken, { useValue: new OneGetter() });
        register(ExternalNumberLoggerToken, {
          useValue: new ExternalNumberLogger(inject(NumberGetterToken)),
        });

        const logger = inject<ExternalNumberLogger>(ExternalNumberLoggerToken);
        logger.logNumber();

        expect(logger).toBeInstanceOf(ExternalNumberLogger);
        expect(logger).toHaveProperty('loggedNumber', 1);
      });

      it('allows a factory to inject a dependency registered after the factory', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');
        const ExternalNumberLoggerToken =
          createInjectionToken<ExternalNumberLogger>('ExternalNumberLogger');

        register(ExternalNumberLoggerToken, {
          useFactory: () =>
            new ExternalNumberLogger(inject(NumberGetterToken)),
        });
        register(NumberGetterToken, { useClass: OneGetter });

        const logger = inject(ExternalNumberLoggerToken);
        logger.logNumber();

        expect(logger.loggedNumber).toBe(1);
      });

      it('fails when useValue injects a dependency that is not registered yet', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');

        expect(() =>
          register(
            createInjectionToken<ExternalNumberLogger>('ExternalNumberLogger'),
            {
              useValue: new ExternalNumberLogger(inject(NumberGetterToken)),
            }
          )
        ).toThrowError('Token Symbol(NumberGetterToken) is not registered.');
      });
    });

    describe('independent tokens', () => {
      it('keeps tokens with the same name independent', () => {
        const first = createInjectionToken<NumberGetter>('NumberGetter');
        const second = createInjectionToken<NumberGetter>('NumberGetter');

        register(first, { useClass: OneGetter });
        register(second, { useClass: TwoGetter });

        expect(inject(first).getNumber()).toBe(1);
        expect(inject(second).getNumber()).toBe(2);
      });
    });

    describe('errors', () => {
      it('should throw an error when registering a dependency twice', () => {
        const NumberGetterToken =
          createInjectionToken<NumberGetter>('NumberGetterToken');

        register(NumberGetterToken, { useValue: new OneGetter() });

        expect(() =>
          register(NumberGetterToken, { useValue: new OneGetter() })
        ).toThrowError(
          'Token Symbol(NumberGetterToken) is already registered.'
        );
      });

      it('throws when the provider is not a class, value, or factory', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetterToken');

        expect(() => register(token, {} as never)).toThrowError(
          'Invalid provider for token Symbol(NumberGetterToken).'
        );
      });

      it('does not cache a useClass instance when construction throws', () => {
        let attempts = 0;

        class Exploding {
          constructor() {
            attempts += 1;
            throw new Error('boom');
          }
        }

        const token = createInjectionToken<Exploding>('Exploding');
        register(token, { useClass: Exploding });

        expect(() => inject(token)).toThrowError('boom');
        expect(() => inject(token)).toThrowError('boom');
        expect(attempts).toBe(2);
      });

      it('does not cache a factory result when the factory throws', () => {
        let attempts = 0;
        const token = createInjectionToken<NumberGetter>('NumberGetterToken');

        register(token, {
          useFactory: () => {
            attempts += 1;
            throw new Error('factory failed');
          },
        });

        expect(() => inject(token)).toThrowError('factory failed');
        expect(() => inject(token)).toThrowError('factory failed');
        expect(attempts).toBe(2);
      });

      it('throws when a circular useClass dependency is detected', () => {
        const AlphaToken = createInjectionToken<{ name: string }>('Alpha');
        const BetaToken = createInjectionToken<{ name: string }>('Beta');

        class Alpha {
          public readonly name = 'alpha';
          public readonly beta = inject(BetaToken);
        }

        class Beta {
          public readonly name = 'beta';
          public readonly alpha = inject(AlphaToken);
        }

        register(AlphaToken, { useClass: Alpha });
        register(BetaToken, { useClass: Beta });

        expect(() => inject(AlphaToken)).toThrowError(
          'Circular dependency detected for token Symbol(Alpha).'
        );
      });
    });
  });

  describe('inject', () => {
    it('throws when the token is not registered and has no default provider', () => {
      const token = createInjectionToken<NumberGetter>('Missing');

      expect(() => inject(token)).toThrowError(
        'Token Symbol(Missing) is not registered.'
      );
    });

    describe('defaultProvider', () => {
      it('auto-registers a default useClass on first inject', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useClass: OneGetter,
        });

        const first = inject(token);
        const second = inject(token);

        expect(first).toBeInstanceOf(OneGetter);
        expect(first).toBe(second);
      });

      it('auto-registers a default useValue on first inject', () => {
        const instance = new OneGetter();
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useValue: instance,
        });

        expect(inject(token)).toBe(instance);
      });

      it('auto-registers a default useFactory on first inject', () => {
        let calls = 0;
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useFactory: () => {
            calls += 1;
            return new OneGetter();
          },
        });

        expect(inject(token)).toBe(inject(token));
        expect(calls).toBe(1);
      });

      it('ignores the default provider when the token is already registered', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useClass: OneGetter,
        });

        register(token, { useClass: TwoGetter });

        expect(inject(token)).toBeInstanceOf(TwoGetter);
      });

      it('throws on a second explicit register after default auto-registration', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useClass: OneGetter,
        });

        inject(token);

        expect(() => register(token, { useClass: TwoGetter })).toThrowError(
          'Token Symbol(NumberGetter) is already registered.'
        );
      });

      it('uses the default provider again after reset', () => {
        const token = createInjectionToken<NumberGetter>('NumberGetter', {
          useClass: OneGetter,
        });

        const beforeReset = inject(token);
        reset();
        const afterReset = inject(token);

        expect(afterReset).toBeInstanceOf(OneGetter);
        expect(afterReset).not.toBe(beforeReset);
      });
    });
  });

  describe('reset', () => {
    it('should reset the container', () => {
      const NumberGetterToken =
        createInjectionToken<NumberGetter>('NumberGetterToken');

      register(NumberGetterToken, { useValue: new OneGetter() });

      const getter = inject<NumberGetter>(NumberGetterToken);

      reset();

      expect(() => inject<NumberGetter>(NumberGetterToken)).toThrowError(
        'Token Symbol(NumberGetterToken) is not registered.'
      );
      expect(getter.getNumber()).toBe(1);
    });

    it('creates a new singleton after reset for useClass', () => {
      const NumberGetterToken =
        createInjectionToken<NumberGetter>('NumberGetterToken');

      register(NumberGetterToken, { useClass: OneGetter });
      const before = inject(NumberGetterToken);

      reset();
      register(NumberGetterToken, { useClass: OneGetter });
      const after = inject(NumberGetterToken);

      expect(after).not.toBe(before);
    });
  });

  describe('global container facades', () => {
    it('exposes the same register, inject, and reset as the global container', () => {
      expect(register).toBe(container.register);
      expect(inject).toBe(container.inject);
      expect(reset).toBe(container.reset);
    });
  });

  describe('isolated Container instances', () => {
    it('does not share registrations with the global container', () => {
      const token = createInjectionToken<NumberGetter>('NumberGetter');
      const isolated = new Container();

      isolated.register(token, { useClass: OneGetter });
      register(token, { useClass: TwoGetter });

      expect(isolated.inject(token)).toBeInstanceOf(OneGetter);
      expect(inject(token)).toBeInstanceOf(TwoGetter);
    });

    it('reset on one container does not clear another', () => {
      const token = createInjectionToken<NumberGetter>('NumberGetter');
      const isolated = new Container();

      isolated.register(token, { useClass: OneGetter });
      register(token, { useClass: TwoGetter });

      isolated.reset();

      expect(() => isolated.inject(token)).toThrowError(
        'Token Symbol(NumberGetter) is not registered.'
      );
      expect(inject(token)).toBeInstanceOf(TwoGetter);
    });
  });
});
