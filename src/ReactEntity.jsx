import _ from 'lodash';

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

  applyEntityConstructor(Type, data) {
    if (Array.isArray(data)) {
      return data.map(instance => new Type(instance));
    }

    return new Type(data);
  }

  _mergeDefault(data) {
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

const LODASH_METHODS = [
  'chunk', 'compact', 'concat', 'countBy', 'difference',
  'differenceBy', 'differenceWith', 'drop', 'dropRight',
  'dropRightWhile', 'dropWhile', 'each', 'eachRight',
  'every', 'fill', 'filter', 'find', 'findIndex',
  'findLast', 'findLastIndex', 'first', 'flatMap',
  'flatten', 'flattenDeep', 'flattenDepth', 'forEach',
  'forEachRight', 'fromPairs', 'groupBy', 'head',
  'includes', 'indexOf', 'initial', 'intersection',
  'intersectionBy', 'intersectionWith', 'invokeMap',
  'join', 'keyBy', 'last', 'lastIndexOf', 'map', 'orderBy',
  'partition', 'pull', 'pullAll', 'pullAllBy', 'pullAllWith',
  'pullAt', 'reduce', 'reduceRight', 'reject', 'remove',
  'reverse', 'sample', 'sampleSize', 'shuffle', 'size',
  'slice', 'some', 'sortBy', 'sortedIndex', 'sortedIndexBy',
  'sortedIndexOf', 'sortedLastIndex', 'sortedLastIndexBy',
  'sortedLastIndexOf', 'sortedUniq', 'sortedUniqBy', 'tail', 'take',
  'takeRight', 'takeRightWhile', 'takeWhile', 'union', 'unionBy',
  'unionWith', 'uniq', 'uniqBy', 'uniqWith', 'unzip', 'unzipWith',
  'without', 'xor', 'xorBy', 'xorWith', 'zip', 'zipObject',
  'zipObjectDeep', 'zipWith'
];

class ReactEntityCollection {
  constructor(data) {
    this.items = _.map(data, ( item ) => {
      if( _.isNil(item) || _.isPlainObject(item) ) {
        return new this.constructor.TYPE(item);
      }

      return item;
    });
  }

  result() {
    return this.items;
  }
}

const reduceToNewItem = (all, arg) => {
    all.push(arg);
    return all;
};

_.each(LODASH_METHODS, (method) => {
  ReactEntityCollection.prototype[method] = function() {
    const args = _.reduce(arguments, reduceToNewItem, [ this.items ]) ;

    const result = _[method].apply(_, args);

    if ( !_.isArray(result) ) { return result; }

    return new this.constructor(result);
  }
});

ReactEntity.ReactEntityCollection = ReactEntityCollection;
export default ReactEntity;
