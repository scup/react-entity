import ReactEntityCollection from './ReactEntityCollection';
import objectsByKey from './typeBuilders/objectsByKey';

const PRIMITIVE_TYPES = [Boolean, Number, String];

const isPrimitiveType = function(type) {
  if (type === Boolean || type === Number || type === String) {
    return true;
  }
  return false;
};

const createGetterAndSetter = function (instance, field){
  return {
    set: function (value){
      if(instance.data[field] !== value) {
        instance.data[field] = value;
        return instance._validate();
      }
    },
    get: function (){ return instance.data[field]; },
    enumerable: true
  }
}

class ReactEntity {
  constructor(data) {
    Object.defineProperty(this, 'schema', {
      value: this.constructor.SCHEMA,
      enumerable: false
    });

    Object.defineProperty(this, 'childrenEntities', {
      value: Object.keys(this.constructor.SCHEMA).filter((field) => !!this.constructor.SCHEMA[field].type),
      enumerable: false
    });

    this.errors = {};
    Object.defineProperty(this, 'data', {
      value: this._mergeDefault(data || {}),
      enumerable: false
    });

    this._validate();
  }

  applyEntityConstructor(field, data) {
     if (data === undefined || data === null) return;

    const Type = field.type;

    if(field.builder) {
      return field.builder(data, Type);
    }

    if (Array.isArray(data)) {
      if (isPrimitiveType(Type)) {
        return data.map(instance => Type(instance));
      }
      return data.map(instance => new Type(instance));
    }

    if (isPrimitiveType(Type)) {
      return Type(data);
    }

    return new Type(data);
  }

  _mergeDefault(data) {
    const newData = {};
    let field;
    for(field in this.schema){
      newData[field] = data[field] === undefined ?this.schema[field].defaultValue : data[field];

      if (this.schema[field].type) {
        newData[field] = this.applyEntityConstructor(this.schema[field], newData[field]);
      }

      Object.defineProperty(this, field, createGetterAndSetter(this, field));
    }
    return newData;
  }

  _fetchChild(fieldValue){
    if (Array.isArray(fieldValue)){
      return fieldValue.map(this._fetchChild)
    }
    if (fieldValue)
    if (fieldValue.fetch){
      return fieldValue.fetch();
    }

    return fieldValue
  }

  __validateField(field) {
    const validator = typeof(this.schema[field]) === 'function' ?
                        this.schema[field] :
                        this.schema[field].validator;

    const error = validator(this.data, field, this.constructor.name + 'Entity');

    if (error) {
      if (!this.errors[field]) {
        this.errors[field] = { errors : [] }
      }

      this.errors[field].errors.push(error.message || error);
    }
  }

  _validate() {
    this.errors = {};

    let field;
    for(field in this.schema){
      this.__validateField(field);
    }
    this.valid = Object.keys(this.errors).length === 0;

    if(!this.valid) {
      return this.errors;
    }
  }

  fetch() {
    let rawData = {};
    for(let field in this.data){
       rawData[field] = this._fetchChild(this.data[field]);
    }

    return rawData;
  }

  getErrors() {
    this._validate();
    const errors = Object.assign({}, this.errors);

    for(let field of this.childrenEntities) {
      const children = Array.isArray(this[field]) ? this[field] : [this[field]];

      children.forEach((entity, index) => {
        if(!entity.valid) {
          if(errors[field] === undefined) { errors[field] = {} }

          errors[field][index] = entity.getErrors();
        }
      })
    }

    return errors;
  }

}

ReactEntity.ReactEntityCollection = ReactEntityCollection;
ReactEntity.Types = { objectsByKey }

export default ReactEntity;
