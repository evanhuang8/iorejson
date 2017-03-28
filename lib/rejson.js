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

Rejson.prototype.execQuery = execQuery;

module.exports = Rejson;