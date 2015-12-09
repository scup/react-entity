## react-entity - Create entities base on [React](https://github.com/facebook/react) [propTypes](https://facebook.github.io/react/docs/reusable-components.html)

[![Build Status](https://travis-ci.org/scup/react-entity.svg?branch=master)](https://travis-ci.org/scup/react-entity)

* [Getting started](#getting-started)
* [Features](#features)
* [Examples](#examples)

### Getting started
    $ npm install react-entity

### Features
* This package let you create entities with schema validator like React PropTypes.

###Examples
```javascript
import { PropTypes } from 'react';

class MyEntity extends ReactEntity {
  static SCHEMA = {
    field: PropTypes.string,
    otherField: {
      type: PropTypes.number,
      defaultValue: 10
    }
  }
}
```

####Get default values
```javascript
const niceInstance = new MyEntity();
console.log(niceInstance.fetch()); // { field: undefined, otherField: 10 }
console.log(niceInstance.errors); // {}
```

####Validations
```javascript
const buggedInstance = new MyEntity({ field: 10, otherField: 'value' });
console.log(buggedInstance.fetch()); // { field: 10, otherField: 'value' }
console.log(buggedInstance.errors); /*
  {
    field: {
      errors: [ 'Invalid undefined `field` of type `number` supplied to `MyEntityEntity`, expected `string`.' ]
    },
    otherField: {
      errors: [ 'Invalid undefined `otherField` of type `string` supplied to `MyEntityEntity`, expected `number`.' ]
    }
  }
*/
```

####Validate on change value
```javascript
const otherInstance = new MyEntity({ field: 'myString' });
console.log(otherInstance.errors); // {}

otherInstance.field = 1;
console.log(otherInstance.errors); // {field: { errors: [ 'Invalid undefined `field` of type `number` supplied to `MyEntityEntity`, expected `string`.' ] }}
```

####Clean unexpected values
```javascript
const anotherInstance = new MyEntity({ field: 'myString', fake: 'fake' });
console.log(anotherInstance.fetch()); // { field: 'myString', otherField: 10 }

```
See [React PropTypes](https://facebook.github.io/react/docs/reusable-components.html)

