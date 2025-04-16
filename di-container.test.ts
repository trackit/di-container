import 'reflect-metadata';
import { beforeEach } from '@jest/globals';
import { register } from './register';
import { inject } from './inject';
import { reset } from './reset';
import { createInjectionToken } from './DIToken';

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
