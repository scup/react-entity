import Faker from 'faker';
import ReactEntity, { ReactEntityCollection } from '../../src/ReactEntity';

const defaultField = Faker.name.firstName();
const defaultValue = Faker.name.firstName();

const fooValidator = function (data, propName){
  if(data[propName] !== 'bar'){
    return `${propName} accepts just 'bar' as value`;
  }
};

class FakeEntityWithDefault extends ReactEntity {
  static SCHEMA = {
    [defaultField]: {
      validator: function (){},
      defaultValue: defaultValue
    },
    [`_${defaultField}`]: {
      validator: function (){},
      defaultValue: `_${defaultValue}`
    },
  }
}

function alwaysTruth(){
  return true;
}

class ProductEntity extends ReactEntity {
  static SCHEMA = {
    name: alwaysTruth,
    price: alwaysTruth
  }
}

class ProductEntityCollection extends ReactEntityCollection {
  static TYPE = ProductEntity;

  getSortedItemsByName() {
    return this.sortBy('name');
  }
}

class Validatable extends ReactEntity {
  static SCHEMA = {
    field: function (data, propName, entityName){
      if(data[propName] !== 'valid'){
        return `${propName} wrong on ${entityName}`;
      }
    },
    otherField: {
      validator: function (data, propName, entityName){
        if(data[propName] !== 'valid'){
          return new Error(`${propName} wrong on ${entityName}`);
        }
      },
      defaultValue: 'bla'
    }
  }
}

class ChildrenEntity  extends ReactEntity {
  static SCHEMA = {
    foo: fooValidator
  }
}

class FatherEntity extends ReactEntity {
  static SCHEMA = {
    foo: {
      validator: fooValidator,
      defaultValue: 'bar'
    }, children: {
      validator: function (){},
      type: ChildrenEntity
    }
  }
}

class FatherWithObjectEntity extends ReactEntity {
  static SCHEMA = {
    children: {
      type: ChildrenEntity,
      validator: alwaysTruth,
      builder: (data, Type) => {
        return Object.keys(data).reduce((result, key) => {
          result[key] = new Type(data[key]);
          return result;
        },{})
      }
    }
  }
}

export default {
  defaultField,
  defaultValue,
  FakeEntityWithDefault,
  ProductEntity,
  ProductEntityCollection,
  Validatable,
  ChildrenEntity,
  FatherEntity,
  FatherWithObjectEntity
}
