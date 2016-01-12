const createGetterAndSetter = function (instance, field){
  return {
    set: function (value){
      if(instance.data[field] !== value) {
        instance.data[field] = value;
        return instance.validate();
      }
    },
    get: function (){ return instance.data[field]; },
    enumerable: true
  }
}

export default class ReactEntity {
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
      value: this.mergeDefault(data || {}),
      enumerable: false
    });

    this.validate();
  }

  applyEntityConstructor(Type, data) {
    if (Array.isArray(data)) {
      return data.map(instance => new Type(instance));
    }

    return new Type(data);
  }

  mergeDefault(data) {
    const newData = {};
    let field;
    for(field in this.schema){

      newData[field] = data[field] || this.schema[field].defaultValue;

      if (this.schema[field].type) {
        newData[field] = this.applyEntityConstructor(this.schema[field].type, newData[field]);
      }

      Object.defineProperty(this, field, createGetterAndSetter(this, field));
    }
    return newData;
  }

  fetch() {
    let rawData = {};
    for(let field in this.data){
       rawData[field] = this.fetchChild(this.data[field]);
    }

    return rawData;
  }

  fetchChild(fieldValue){
    if (Array.isArray(fieldValue)){
      return fieldValue.map(this.fetchChild)
    }
    if (fieldValue)
    if (fieldValue.fetch){
      return fieldValue.fetch();
    }

    return fieldValue
  }

  validateField(field) {
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

  validate() {
    this.errors = {};

    let field;
    for(field in this.schema){
      this.validateField(field);
    }
    this.valid = Object.keys(this.errors).length === 0;

    if(!this.valid) {
      return this.errors;
    }
  }

  getErrors() {
    this.validate();
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
