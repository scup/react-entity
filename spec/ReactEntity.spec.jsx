import Faker from 'faker';
import ReactEntity from '../src/ReactEntity.jsx';

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

describe('ReactEntity', function (){
  it('should merge with default data', function (){
    const fakeEntity = new FakeEntityWithDefault();

    expect(fakeEntity[defaultField]).toBe(defaultValue);
  });

  it('should clean data on fetch', function (){
    const fakeEntity = new FakeEntityWithDefault({
      fakeAttribute: 'should not come'
    });

    expect(fakeEntity.fetch()).toEqual({
      [defaultField]: defaultValue,
      [`_${defaultField}`]: `_${defaultValue}`
    });
  });

  it('should create set for property and call validate when change', function (){
    const fakeEntity = new FakeEntityWithDefault();
    spyOn(fakeEntity, '_validate');

    fakeEntity[`_${defaultField}`] = `_${defaultValue}`;
    expect(fakeEntity._validate).not.toHaveBeenCalled();

    fakeEntity[`_${defaultField}`] = defaultValue;
    expect(fakeEntity._validate).toHaveBeenCalled();
  });

  it('should not use defaultValue when a value is passed', function (){
    const newValue = Faker.name.findName();
    const fakeEntity = new FakeEntityWithDefault({
      [defaultField]: newValue
    });

    expect(fakeEntity[`_${defaultField}`]).toBe(`_${defaultValue}`);
    expect(fakeEntity[defaultField]).toBe(newValue);
  });

  it('should validate when build', function (){
    // given
    spyOn(Validatable.SCHEMA, 'field').and.returnValue(null)
    spyOn(Validatable.SCHEMA.otherField, 'validator').and.returnValue(null)

    // when
    new Validatable({
      field: 'value',
      noField: 'should not go'
    });

    // then
    expect(Validatable.SCHEMA.field).toHaveBeenCalledWith(
      { field: 'value', otherField: 'bla' },
      'field',
      'ValidatableEntity'
    );
    expect(Validatable.SCHEMA.otherField.validator).toHaveBeenCalledWith(
      { field: 'value', otherField: 'bla' },
      'otherField',
      'ValidatableEntity'
    );
  });

  it('should auto validate', function (){
    // when
    const entity = new Validatable({ field: 'invalid', otherField: 'invalid'});

    expect(entity.valid).toBe(false);
    entity.field = 'valid';

    expect(entity.valid).toBe(false);
    entity.otherField = 'valid';
    expect(entity.valid).toBe(true);
  });

  describe('children', function (){
    it('should auto buid child entities', function (){
      const father = new FatherEntity({
        children: [
          {},
          {}
        ]
      });

      expect(father.children[0].constructor === ChildrenEntity).toBe(true);
      expect(father.children[1].constructor === ChildrenEntity).toBe(true);
    });

    it('should include errors of children', function (){
      const father = new FatherEntity({
        foo: 'test',
        children: [{ foo: 'bar' }]
      });

      expect(father.getErrors()).toEqual({ foo: { errors: [ `foo accepts just 'bar' as value` ] } });

      const lee = new ChildrenEntity({ foo: 'bar invalid '});
      father.children.push(lee);

      expect(father.getErrors()).toEqual({
        foo: { errors: [ `foo accepts just 'bar' as value` ] },
        children: { 1: { foo: { errors: [ `foo accepts just 'bar' as value` ] } } }
      });
    });
  });
});
