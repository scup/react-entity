export default class Entity {
  constructor(data){
    this.schema = this.constructor.SCHEMA;
    this.errors = {};
    this.data   = this.mergeDefault(data || {});
    this.validate();
  }

  mergeDefault(data){
    const newData = {};
    for(var field in this.schema){
      newData[field] = data[field] || this.schema[field].defaultValue;

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

  validateField(field) {
    const type = typeof(this.schema[field]) === 'function' ?
                   this.schema[field] :
                   this.schema[field].type;

    const error = type(this.data, field, this.constructor.name + 'Entity');

    if (error) {
      if (!this.errors[field]) {
        this.errors[field] = { errors : [] }
      }

      this.errors[field].errors.push(error.message || error);
    }
  }

  validate(){
    this.errors = {};

    for(var field in this.schema){
      this.validateField(field);
    }
  }
}
