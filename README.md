# Di-Container

A typesafe dependency injection container implemented as a wrapper around Tsyringe, designed for ease of use and better control over your application's dependencies.

## Installation

Copy and paste this folder in you common library, and add it to your tsconfig.json.

```json
{
  "paths": {
    "@di-container": [
      "./services/common/di-container/index"
    ]
  }
}
```

This container is directly available through the alias `@di-container`, no installation is required.

## Usage

### Define a type and a token

Define a type that you want to inject, and create a token for it. The token is used to register and retrieve the dependency.

```typescript
import { createInjectionToken } from '@di-container';

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
The registration will typically happen in your bounded context's **composition root**, where you can define all the "wiring" of the context.

Here's how to register the dependency:

```typescript
import { register } from '@di-container';

// For classes that you define your self, you should use useClass:
register(NumberGetterToken, { useClass: OneGetter });

// When you want to direcly provide a instance and possibly provide configuration to the constructor, use useValue:
register(NumberGetterToken, { useValue: new OneGetter() });

// When you want each injection to provide a new instance, use useFactory:
register(NumberGetterToken, { useFactory: () => new OneGetter() });
```
Please note, if a dependency is re-registered, it will throw an exception. Dependencies are not allowed to be overridden.

### Retrieving a dependency

Once the dependency is registered, you can retrieve it using the `inject` function:

```typescript
const getter = inject<NumberGetter>(NumberGetterToken);

const number = getter.getNumber() // 1, assuming OneGetter is registered
```

### Resetting the container

You can clear the container of all registered dependencies using the `reset` function.

## Building classes for your bounded context
When creating classes, you should avoid using a constructor, and rely on the container to inject your dependencies.

### Do

```typescript
import { inject } from '@di-container';
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
register(DynamoDBConfigToken, { useValue: dynamoDbConfig });
register(StorageAdapterToken, {
  useValue: new DynamoDbStorageAdapter({
    tableName: 'recipe-table',
    dynamoDBClient: new DynamoDBClient(inject(DynamoDBConfigToken)),
  }),
});
```
