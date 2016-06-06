'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ReactEntityCollection = require('./ReactEntityCollection');

var _ReactEntityCollection2 = _interopRequireDefault(_ReactEntityCollection);

var _typeBuildersObjectsByKey = require('./typeBuilders/objectsByKey');

var _typeBuildersObjectsByKey2 = _interopRequireDefault(_typeBuildersObjectsByKey);

var createGetterAndSetter = function createGetterAndSetter(instance, field) {
  return {
    set: function set(value) {
      if (instance.data[field] !== value) {
        instance.data[field] = value;
        return instance._validate();
      }
    },
    get: function get() {
      return instance.data[field];
    },
    enumerable: true
  };
};

var ReactEntity = (function () {
  function ReactEntity(data) {
    var _this = this;

    _classCallCheck(this, ReactEntity);

    Object.defineProperty(this, 'schema', {
      value: this.constructor.SCHEMA,
      enumerable: false
    });

    Object.defineProperty(this, 'childrenEntities', {
      value: Object.keys(this.constructor.SCHEMA).filter(function (field) {
        return !!_this.constructor.SCHEMA[field].type;
      }),
      enumerable: false
    });

    this.errors = {};
    Object.defineProperty(this, 'data', {
      value: this._mergeDefault(data || {}),
      enumerable: false
    });

    this._validate();
  }

  _createClass(ReactEntity, [{
    key: 'applyEntityConstructor',
    value: function applyEntityConstructor(field, data) {
      if (!data) return;

      var Type = field.type;

      if (field.builder) {
        return field.builder(data, Type);
      }

      if (Array.isArray(data)) {
        return data.map(function (instance) {
          return new Type(instance);
        });
      }

      return new Type(data);
    }
  }, {
    key: '_mergeDefault',
    value: function _mergeDefault(data) {
      var newData = {};
      var field = undefined;
      for (field in this.schema) {

        newData[field] = data[field] || this.schema[field].defaultValue;

        if (this.schema[field].type) {
          newData[field] = this.applyEntityConstructor(this.schema[field], newData[field]);
        }

        Object.defineProperty(this, field, createGetterAndSetter(this, field));
      }
      return newData;
    }
  }, {
    key: '_fetchChild',
    value: function _fetchChild(fieldValue) {
      if (Array.isArray(fieldValue)) {
        return fieldValue.map(this._fetchChild);
      }
      if (fieldValue) if (fieldValue.fetch) {
        return fieldValue.fetch();
      }

      return fieldValue;
    }
  }, {
    key: '__validateField',
    value: function __validateField(field) {
      var validator = typeof this.schema[field] === 'function' ? this.schema[field] : this.schema[field].validator;

      var error = validator(this.data, field, this.constructor.name + 'Entity');

      if (error) {
        if (!this.errors[field]) {
          this.errors[field] = { errors: [] };
        }

        this.errors[field].errors.push(error.message || error);
      }
    }
  }, {
    key: '_validate',
    value: function _validate() {
      this.errors = {};

      var field = undefined;
      for (field in this.schema) {
        this.__validateField(field);
      }
      this.valid = Object.keys(this.errors).length === 0;

      if (!this.valid) {
        return this.errors;
      }
    }
  }, {
    key: 'fetch',
    value: function fetch() {
      var rawData = {};
      for (var field in this.data) {
        rawData[field] = this._fetchChild(this.data[field]);
      }

      return rawData;
    }
  }, {
    key: 'getErrors',
    value: function getErrors() {
      var _this2 = this;

      this._validate();
      var errors = Object.assign({}, this.errors);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function () {
          var field = _step.value;

          var children = Array.isArray(_this2[field]) ? _this2[field] : [_this2[field]];

          children.forEach(function (entity, index) {
            if (!entity.valid) {
              if (errors[field] === undefined) {
                errors[field] = {};
              }

              errors[field][index] = entity.getErrors();
            }
          });
        };

        for (var _iterator = this.childrenEntities[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return errors;
    }
  }]);

  return ReactEntity;
})();

ReactEntity.ReactEntityCollection = _ReactEntityCollection2['default'];
ReactEntity.Types = { objectsByKey: _typeBuildersObjectsByKey2['default'] };

exports['default'] = ReactEntity;
module.exports = exports['default'];