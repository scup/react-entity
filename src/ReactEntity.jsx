export default class Entity {
  constructor(data){
    this.errors = {};
    this.data = this.mergeDefault(data);
    this.validate()
  }

  mergeDefault(data){
    const schema = this.constructor.SCHEMA;
    const newData = {};
    for(var field in schema){
      newData[field] = data[field] || schema[field].defaultValue;

      Object.defineProperty(this, field, {
        set: (value) => {
          if(this.data[field] !== value) {
            this.data[field] = value;
            this.validate();
          }
        },
        get: () => this.data[field]
      })
    }
    return newData;
  }

  fetch(){
    return this.data;
  }

  validate(){
    let hasError = false;
    this.errors = {};
    const schema = this.constructor.SCHEMA;
    const newData = {};

    for(var field in schema){
      let type = typeof(schema[field]) === 'function' ? schema[field] : schema[field].type;
      let error = type(this.data,field,this.constructor.name + 'Entity');
      if (error) {
        hasError = true;
        if (!this.errors[field])
          this.errors[field] = {errors : []}
        this.errors[field].errors.push(error.message || error);
      }
    }

    return hasError;
  }
}
