/**
 * Parse composite query
 */

var _ = require('lodash');

var PRIMITIVE_TYPES = [
  'boolean', 
  'string',
  'number'
];

var QUERY_KEYWORDS = [
  '$set',
  '$del'
];

function execQuery(key, query) {
  var t = this.client.multi();
  var instance = {
    interface: this,
    cmds: this.cmds,
    client: t
  };
  _walkQuery.call(instance, key, query, '.');
  return t.exec();
}

function _walkQuery(key, query, prefix) {
  for (var branch in query) {
    if (query.hasOwnProperty(branch)) {
      var path = prefix + branch + '.';
      var child = query[branch];
      // When the child is one of the primitive types, shorthand to SET
      if (PRIMITIVE_TYPES.indexOf(typeof child) !== -1) {
        this.interface.set.call(this, key, path, child);
      // Otherwise, it's an object, check if it contains an operator word
      } else if (_.intersection(Object.keys(child), QUERY_KEYWORDS).length > 0) {

      // Otherwise, continue the walk
      } else {
        _walkQuery.call(this, key, child, path);
      }
    }
  }
}

module.exports = execQuery;