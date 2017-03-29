var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var Redis = require('ioredis');

var execQuery = require('./query');

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
 * Default options
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
 * Commands
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
 * @param {string} key1 - The first key to look for
 * @param {string} key2 - The second key to look for, optional
 * ...
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
 * @param {string} key - The key of the value
 * @param {string} path - The path of the value
 * @return {Promise} - A promise that will resolve to array of keys at path
 * @public
 */
Rejson.prototype.objkeys = function(key, path) {
  var cmd = this.cmds['JSON.OBJKEYS'];
  return cmd.call(this.client, key, path);
};

Rejson.prototype.objlen = function(key, path) {
  var cmd = this.cmds['JSON.OBJLEN'];
  return cmd.call(this.client, key, path);
};

Rejson.prototype.type = function(key, path) {
  var cmd = this.cmds['JSON.TYPE'];
  return cmd.call(this.client, key, path);
};

Rejson.prototype.numincrby = function(key, path, number) {
  var cmd = this.cmds['JSON.NUMINCRBY'];
  return cmd.call(this.client, key, path, number).then(function(result) {
    return parseFloat(result);
  });
};

Rejson.prototype.nummultby = function(key, path, number) {
  var cmd = this.cmds['JSON.NUMMULTBY'];
  return cmd.call(this.client, key, path, number).then(function(result) {
    return parseFloat(result);
  });
};

Rejson.prototype.strappend = function(key, path, string) {
  var cmd = this.cmds['JSON.STRAPPEND'];
  return cmd.call(this.client, key, path, JSON.stringify(string));
};

Rejson.prototype.strlen = function(key, path) {
  var cmd = this.cmds['JSON.STRLEN'];
  return cmd.call(this.client, key, path);
};

Rejson.prototype.arrappend = function() {
  var cmd = this.cmds['JSON.ARRAPPEND'];
  var _arguments = Array.prototype.slice.call(arguments);
  var fixed = _arguments.slice(0, 2);
  var items = _.map(_arguments.slice(2), function(item) {
    return JSON.stringify(item);
  });
  return cmd.apply(this.client, fixed.concat(items));
};

Rejson.prototype.arrindex = function(key, path, scalar) {
  var cmd = this.cmds['JSON.ARRINDEX'];
  return cmd.call(this.client, key, path, JSON.stringify(scalar));
};

Rejson.prototype.arrinsert = function() {
  var cmd = this.cmds['JSON.ARRINSERT'];
  var _arguments = Array.prototype.slice.call(arguments);
  var fixed = _arguments.slice(0, 3);
  var items = _.map(_arguments.slice(3), function(item) {
    return JSON.stringify(item);
  });
  return cmd.apply(this.client, fixed.concat(items));
};

Rejson.prototype.arrlen = function(key, path) {
  var cmd = this.cmds['JSON.ARRLEN'];
  return cmd.call(this.client, key, path);
};

Rejson.prototype.arrpop = function(key, path, index) {
  var cmd = this.cmds['JSON.ARRPOP'];
  return cmd.call(this.client, key, path, index).then(function(result) {
    return JSON.parse(result);
  });
};

Rejson.prototype.arrtrim = function(key, path, start, end) {
  var cmd = this.cmds['JSON.ARRTRIM'];
  return cmd.call(this.client, key, path, start, end);
};

Rejson.prototype.execQuery = execQuery;

module.exports = Rejson;