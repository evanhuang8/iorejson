var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var Redis = require('ioredis');

/**
 * Creates a Rejson instance
 * 
 * @constructor
 */
function Rejson(opts) {

  // Instantiation
  if (!(this instanceof Rejson)) {
    return new Rejson(opts);
  }

  EventEmitter.call(this);

  opts = opts || {};
  _.defaults(opts, Rejson.defaultOptions);
  var redis = new Redis(opts);


  // Add new commands
  this.cmds = {};
  for (var i in Rejson.commands) {
    var command = Rejson.commands[i];
    var cmd = redis.createBuiltinCommand(command);
    this.cmds[command] = cmd.string;
    this.cmds[command + 'Buffer'] = cmd.buffer;
  }

  this.client = redis;
  var _this = this;
  this.client.on('ready', function() {
    _this.emit('ready');
  });

}

util.inherits(Rejson, EventEmitter);

/**
 * Connect
 * @return {Promise}
 */
Rejson.prototype.connect = function() {
  return new Promise(function(resolve, reject) {
    this.client.on('ready', function() {
      resolve();
      return;
    });
    this.client.on('error', function(err) {
      reject(err);
      return;
    });
  }.bind(this));
};

/**
 * Default connection options
 * @type {Object}
 */
Rejson.defaultOptions = {
  // Connection
  port: 6379,
  host: 'localhost',
  db: 0,
  password: null
};

/**
 * List of rejson commands
 * @type {Array}
 */
Rejson.commands = [
  'JSON.DEL',
  'JSON.GET',
  'JSON.MGET',
  'JSON.SET',
  'JSON.TYPE',
  'JSON.NUMINCRBY',
  'JSON.NUMMULTBY',
  'JSON.STRAPPEND',
  'JSON.STRLEN',
  'JSON.ARRAPPEND',
  'JSON.ARRINDEX',
  'JSON.ARRINSERT',
  'JSON.ARRLEN',
  'JSON.ARRPOP',
  'JSON.ARRTRIM',
  'JSON.OBJKEYS',
  'JSON.OBJLEN',
  'JSON.DEBUG',
  'JSON.FORGET',
  'JSON.RESP'
];

/**
 * Set a JSON value
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonset|JSON.SET}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @param {object} value - The value to set
 * @return {Promise} - A promise that will resolve to true when value is set
 * @public
 */
Rejson.prototype.set = function(key, path, value) {
  var _value = JSON.stringify(value);
  var cmd = this.cmds['JSON.SET'];
  return cmd.call(this.client, key, path, _value).then(function(result) {
    if (result === 'OK') {
      return true;
    }
    throw new Error(result);
  });
};

/**
 * Get a JSON value
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonget|JSON.GET}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the JSON object at key path, or null if not found
 * @public
 */
Rejson.prototype.get = function(key, path) {
  var cmd = this.cmds['JSON.GET'];
  return cmd.call(this.client, key, path).then(function(value) {
    return JSON.parse(value);
  });
};

/**
 * Get multiple JSON values at the same time (for a given path)
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonmget|JSON.MGET}
 *
 * @param {...string} key - The key to get value for
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to an array of the JSON objects found at key paths
 * @public
 */
Rejson.prototype.mget = function() {
  var cmd = this.cmds['JSON.MGET'];
  var _arguments = Array.prototype.slice.call(arguments);
  return cmd.apply(this.client, _arguments).then(function(results) {
    return _.map(results, function(value) {
      return JSON.parse(value);
    });
  });
};

/**
 * Delete a JSON value (or value at a specific path)
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsondel|JSON.DEL}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to true when value is deleted
 * @public
 */
Rejson.prototype.del = function(key, path) {
  var cmd = this.cmds['JSON.DEL'];
  return cmd.call(this.client, key, path).then(function(result) {
    return result === 1;
  });
};

/**
 * Get the object keys for a JSON value (for a given path)
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonobjkeys|JSON.OBJKEYS}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to array of keys at path
 * @public
 */
Rejson.prototype.objkeys = function(key, path) {
  var cmd = this.cmds['JSON.OBJKEYS'];
  return cmd.call(this.client, key, path);
};

/**
 * Get the number of object keys for a JSON value (for a given path)
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonobjlen|JSON.OBJLEN}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the number of keys at path
 * @public
 */
Rejson.prototype.objlen = function(key, path) {
  var cmd = this.cmds['JSON.OBJLEN'];
  return cmd.call(this.client, key, path);
};


/**
 * Get the JSON type for a JSON value (for a given path)
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsontype|JSON.TYPE}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the type of value at path
 * @public
 */
Rejson.prototype.type = function(key, path) {
  var cmd = this.cmds['JSON.TYPE'];
  return cmd.call(this.client, key, path);
};


/**
 * Increase a number field by some value (for a given path)
 *
 * If called on a key path that is not a number type, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonnumincrby|JSON.NUMINCRBY}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the new number value at path
 * @public
 */
Rejson.prototype.numincrby = function(key, path, number) {
  var cmd = this.cmds['JSON.NUMINCRBY'];
  return cmd.call(this.client, key, path, number).then(function(result) {
    return parseFloat(result);
  });
};

/**
 * Multiply a number field by some value (for a given path)
 *
 * If called on a key path that is not a number type, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonnummultby|JSON.NUMMULTBY}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the new number value at path
 * @public
 */
Rejson.prototype.nummultby = function(key, path, number) {
  var cmd = this.cmds['JSON.NUMMULTBY'];
  return cmd.call(this.client, key, path, number).then(function(result) {
    return parseFloat(result);
  });
};


/**
 * Append a string field by some string (for a given path)
 *
 * If called on a key path that is not a string type, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonstrappend|JSON.STRAPPEND}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the new string value at path
 * @public
 */
Rejson.prototype.strappend = function(key, path, string) {
  var cmd = this.cmds['JSON.STRAPPEND'];
  return cmd.call(this.client, key, path, JSON.stringify(string));
};

/**
 * Get the length for a string value (for a given path)
 *
 * If called on a key path that is not a string type, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonstrlen|JSON.STRLEN}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the length of string at path
 * @public
 */
Rejson.prototype.strlen = function(key, path) {
  var cmd = this.cmds['JSON.STRLEN'];
  return cmd.call(this.client, key, path);
};

/**
 * Append an array field by some elements (for a given path)
 *
 * Elements will be added after the last element in array. 
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrappend|JSON.ARRAPPEND}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the new size of array at path
 * @public
 */
Rejson.prototype.arrappend = function() {
  var cmd = this.cmds['JSON.ARRAPPEND'];
  var _arguments = Array.prototype.slice.call(arguments);
  var fixed = _arguments.slice(0, 2);
  var items = _.map(_arguments.slice(2), function(item) {
    return JSON.stringify(item);
  });
  return cmd.apply(this.client, fixed.concat(items));
};

/**
 * Find the index of first occurrance of a scalar JSON value in array (for a given path)
 *
 * If item is not found, -1 will be returned.
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrindex|JSON.ARRINDEX}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @param {*} scalar - The JSON scalar to search for
 * @return {Promise} - A promise that will resolve to the index of the element if found, -1 if not found
 * @public
 */
Rejson.prototype.arrindex = function(key, path, scalar) {
  var cmd = this.cmds['JSON.ARRINDEX'];
  return cmd.call(this.client, key, path, JSON.stringify(scalar));
};

/**
 * Insert some elements to an array field at given index (for a given path)
 *
 * Multiple elements are accepted. 
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrinsert|JSON.ARRINSERT}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @param {number} index - The index to insert at
 * @param {...*} element - The element to insert to array
 * @return {Promise} - A promise that will resolve to the new size of array at path
 * @public
 */
Rejson.prototype.arrinsert = function() {
  var cmd = this.cmds['JSON.ARRINSERT'];
  var _arguments = Array.prototype.slice.call(arguments);
  var fixed = _arguments.slice(0, 3);
  var items = _.map(_arguments.slice(3), function(item) {
    return JSON.stringify(item);
  });
  return cmd.apply(this.client, fixed.concat(items));
};

/**
 * Get the number of elements for an array field (for a given path)
 * 
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrlen|JSON.ARRLEN}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to the size of array at path
 * @public
 */
Rejson.prototype.arrlen = function(key, path) {
  var cmd = this.cmds['JSON.ARRLEN'];
  return cmd.call(this.client, key, path);
};

/**
 * Remove and return the element at index for an array field (for a given path)
 * 
 * Note that the resulting array will have a size of N-1. 
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrlen|JSON.ARRLEN}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @param {number} index - The index of the element to pop
 * @return {Promise} - A promise that will resolve to element popped
 * @public
 */
Rejson.prototype.arrpop = function(key, path, index) {
  var cmd = this.cmds['JSON.ARRPOP'];
  return cmd.call(this.client, key, path, index).then(function(result) {
    return JSON.parse(result);
  });
};

/**
 * Trim the array so it only contains elements within the specified inclusive range (for a given path)
 * 
 * This command is very forgiving and you may supply index that is out of the
 * range of the actual array. 
 * If called on a key path that is not an array, it will throw an error.
 *
 * {@link https://redislabsmodules.github.io/rejson/commands/#jsonarrlen|JSON.ARRLEN}
 *
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @param {number} start - The start index, inclusive
 * @param {number} end - The end index, inclusive
 * @return {Promise} - A promise that will resolve to the size of the new array
 * @public
 */
Rejson.prototype.arrtrim = function(key, path, start, end) {
  var cmd = this.cmds['JSON.ARRTRIM'];
  return cmd.call(this.client, key, path, start, end);
};

module.exports = Rejson;