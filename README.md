# @trackit/di-container

A typesafe dependency injection container implemented as a wrapper around Tsyringe, designed for ease of use and better control over your application's dependencies.

## Installation

```bash
npm install @trackit/di-container
```

## Usage

### Define a type and a token

Define a type that you want to inject, and create a token for it. The token is used to register and retrieve the dependency.

```typescript
import { createInjectionToken } from '@trackit/di-container';

type NumberGetter = {
  getNumber: () => number;
};

const NumberGetterToken = createInjectionToken<NumberGetter>('NumberGetterToken');
```

### Define an implementation

```typescript
class OneGetter implements NumberGetter {
  public getNumber(): number {
    return 1;
  }
}
```

### Register the implementation

After defining the token and the implementation, you can register the dependency in the container. You can use one of the three providers: `useValue`, `useClass`, or `useFactory`.

Here's how to register the dependency:

```typescript
import { register } from '@trackit/di-container';

// For classes that you define yourself, you should use useClass:
register(NumberGetterToken, { useClass: OneGetter });

// When you want to directly provide an instance and possibly provide configuration to the constructor, use useValue:
register(NumberGetterToken, { useValue: new OneGetter() });

// When you need to control how the instance is created (e.g., external clients with config), use useFactory:
register(DynamoDBClientToken, { useFactory: () => new DynamoDBClient({ region: 'eu-west-1' }) });
```

Please note, if a dependency is re-registered, it will throw an exception. Dependencies are not allowed to be overridden.

### Retrieving a dependency

Once the dependency is registered, you can retrieve it using the `inject` function:

```typescript
import { inject } from '@trackit/di-container';

const getter = inject(NumberGetterToken);

const number = getter.getNumber(); // 1, assuming OneGetter is registered
```

### Resetting the container

You can clear the container of all registered dependencies using the `reset` function.

```typescript
import { reset } from '@trackit/di-container';

reset();
```

### CompositionRoot pattern

The CompositionRoot pattern centralizes all dependency registrations in one place, making it easy to swap implementations for testing or different environments.

```typescript
import { register, reset } from '@trackit/di-container';
import { RecipeRepositoryToken } from './core/ports/RecipeRepository';
import { DynamoDbRecipeRepository } from './infrastructure/DynamoDbRecipeRepository';
import { InMemoryRecipeRepository } from './infrastructure/InMemoryRecipeRepository';

// Production registrations (might not be required if you provided default values to all tokens)
const registerProductionInfrastructure = () => {
  register(RecipeRepositoryToken, { useClass: DynamoDbRecipeRepository });
};

// Test registrations with in-memory implementations
const registerTestInfrastructure = () => {
  register(RecipeRepositoryToken, { useClass: InMemoryRecipeRepository });
};

// In your app entry point (e.g., main.ts)
registerProductionInfrastructure();

// In your test setup (e.g., beforeEach)
beforeEach(() => {
  reset(); // Clear all registrations
  registerTestInfrastructure();
});
```

### Testing pattern recommendation

Use a `setup` function to encapsulate container reset, test registrations, and return both the system under test and its dependencies for assertions.

```typescript
import { reset, register, inject, createInjectionToken } from '@trackit/di-container';
import { EventPublisherToken } from './core/ports/EventPublisher';
import { InMemoryEventPublisher } from './infrastructure/InMemoryEventPublisher';
import { CreateRecipeUseCase } from './core/useCases/CreateRecipeUseCase';

// The interface used by production code
interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

// The test implementation extends the interface with test-specific methods
interface InMemoryEventPublisher extends EventPublisher {
  getPublishedEvents(): DomainEvent[];
}

// Token for the concrete test implementation (avoids type casting)
const InMemoryEventPublisherToken = createInjectionToken<InMemoryEventPublisher>(
  'InMemoryEventPublisher'
);

const registerTestInfrastructure = () => {
  // Register the concrete implementation first
  register(InMemoryEventPublisherToken, { useClass: InMemoryEventPublisher });
  // Then register the interface token pointing to the same instance
  register(EventPublisherToken, { useFactory: () => inject(InMemoryEventPublisherToken) });
};

const setup = () => {
  reset();
  registerTestInfrastructure();

  const createRecipeUseCase = new CreateRecipeUseCase();

  return {
    createRecipeUseCase,
    eventPublisher: inject(InMemoryEventPublisherToken),
  };
};

describe('CreateRecipeUseCase', () => {
  it('should publish a RecipeCreated event', async () => {
    const { createRecipeUseCase, eventPublisher } = setup();

    await createRecipeUseCase.execute({ name: 'Pasta', ingredients: ['tomato', 'basil'] });

    expect(eventPublisher.getPublishedEvents()).toContainEqual({
      type: 'RecipeCreated',
      payload: {
        id: expect.any(String),
        name: 'Pasta',
        ingredients: ['tomato', 'basil'],
      },
    });
  });
});
```

This pattern provides:
- **Isolation**: Each test starts with a fresh container via `reset()`
- **Access to dependencies**: The setup returns injected dependencies for assertions
- **Type safety**: Using a separate token for the test implementation avoids type casting

## Type Imports

When you only need to import types (for type annotations), use `import type` for better tree-shaking:

```typescript
import { inject, register, createInjectionToken } from '@trackit/di-container';
import type { Token, Provider, Factory } from '@trackit/di-container';
```

## Building classes

When creating classes, you should avoid using a constructor, and rely on the container to inject your dependencies.

### Do

```typescript
import { inject } from '@trackit/di-container';
import { RecipeRepositoryToken } from '../core/ports/RecipeRepository';

class RecipeService {
  private readonly recipeRepository = inject(RecipeRepositoryToken);
}
```

### Don't

```typescript
import { RecipeRepository } from '../core/ports/RecipeRepository';

class RecipeService {
  private readonly recipeRepository: RecipeRepository;

  constructor(recipeRepository: RecipeRepository) {
    this.recipeRepository = recipeRepository;
  }
}
```

## Advanced usage

### Registering external dependencies that need constructor injection

When registering external dependencies that need constructor injection, you can use the `inject` function directly in a `useValue` or `useFactory` provider:

```typescript
import { register, inject, createInjectionToken } from '@trackit/di-container';

register(DynamoDBConfigToken, { useValue: dynamoDbConfig });
register(StorageAdapterToken, {
  useValue: new DynamoDbStorageAdapter({
    tableName: 'recipe-table',
    dynamoDBClient: new DynamoDBClient(inject(DynamoDBConfigToken)),
  }),
});
```

## License

ISC
