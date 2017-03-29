var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;

var Rejson = require('../lib/rejson');
var Redis = require('ioredis');

var redisOpts = {};
try {
  redisOpts = JSON.parse(fs.readFileSync(path.join(__dirname, 'redis.json')));
} catch (err) {
  // Ignore
}

function* getInstance() {
  var instance = new Rejson(redisOpts);
  yield instance.connect();
  return instance;
};

function getKey(key) {
  return 'rjk.' + key;
}

describe('Rejson', function() {

  it('should exist', function() {
    expect(Rejson).to.exist;
  });

  it('should correctly add the commands', function() {
    var rejson = new Rejson(redisOpts);
    expect(rejson).to.exist;
    expect(rejson instanceof Rejson).to.be.true;
    expect(rejson.client instanceof Redis).to.be.true;
    for (var i in Rejson.commands) {
      var command = Rejson.commands[i];
      expect(rejson.cmds[command]).to.exist;
    }
  });

  describe('Commands', function() {

    before(function* () {
      this.instance = yield getInstance();
    });

    beforeEach(function* () {
      yield this.instance.client.flushall();
    });

    it('#set, #get, #del', function* () {
      var result;
      var key = getKey('test_gsd');
      var path = '.';
      var value = {
        foo: 'bar',
        chic: {
          fil: 'a'
        },
        'is': 1
      };
      // SET
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      // GET
      result = yield this.instance.get(key, path);
      expect(result).to.deep.equal(value);
      // DEL
      result = yield this.instance.del(key, '.is');
      expect(result).to.be.true;
      result = yield this.instance.get(key, path);
      delete value['is'];
      expect(result).to.deep.equal(value);
      result = yield this.instance.del(key, '.is');
      expect(result).to.be.false;
    });

    it('#mget', function* () {
      var result;
      var path = '.';
      var key1 = getKey('test_mget_1');
      var value1 = {
        foo: 'bar',
        chic: {
          fil: 'a'
        },
        'is': 1
      };
      result = yield this.instance.set(key1, path, value1);
      expect(result).to.be.true;
      result = yield this.instance.get(key1, path);
      expect(result).to.deep.equal(value1);
      var key2 = getKey('test_mget_2');
      var value2 = {
        foo: ['a', 1, true]
      };
      result = yield this.instance.set(key2, path, value2);
      expect(result).to.be.true;
      result = yield this.instance.get(key2, path);
      expect(result).to.deep.equal(value2);
      // MGET
      results = yield this.instance.mget(key2, key1, path);
      expect(results).to.deep.equal([value2, value1]);
      // MGET @ path
      results = yield this.instance.mget(key1, key2, '.foo');
      expect(results).to.deep.equal([value1.foo, value2.foo]);
    });

    it('#objkeys', function*() {
      var result;
      var key = getKey('test_objkeys');
      var path = '.';
      var value = {
        foo: 'bar',
        chic: {
          fil: 'a',
          burger: 'tasy',
          shake: false
        },
        'is': 1
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      keys = yield this.instance.objkeys(key, path);
      expect(keys).to.deep.equal(['foo', 'chic', 'is']);
      keys = yield this.instance.objkeys(key, '.chic');
      expect(keys).to.deep.equal(['fil', 'burger', 'shake']);
    });

    it('#type', function* () {
      var result;
      var key = getKey('test_type');
      var path = '.';
      var value = {
        foo: 'bar',
        chic: {
          fil: true,
          a: 3.1415926
        },
        'is': 1
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      var entries = [
        ['.', 'object'],
        ['.foo', 'string'],
        ['.chic', 'object'],
        ['.is', 'integer'],
        ['.chic.fil', 'boolean'],
        ['.chic.a', 'number']
      ];
      for (var i in entries) {
        var type = yield this.instance.type(key, entries[i][0]);
        expect(type).to.equal(entries[i][1]);
      }
    });

    it('#numincrby', function* () {
      var result;
      var key = getKey('test_numincrby');
      var path = '.';
      var value = {
        a: 1,
        b: 2.333333,
        c: 4,
        d: 'hello',
        e: true,
        f: {
          g: 4
        }
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.numincrby(key, '.a', 2);
      expect(result).to.equal(3);
      result = yield this.instance.numincrby(key, '.b', 1.333333);
      expect(result).to.equal(3.666666);
    });

  });

  describe.skip('Query', function() {

    before(function* () {
      this.instance = yield getInstance();
    });

    beforeEach(function* () {
      yield this.instance.client.flushall();
    });

    it('should be able to use composite query', function* () {
      var result;
      var key = getKey('test_objkeys');
      var path = '.';
      var value = {
        foo: 'bar',
        chic: {
          fil: 'a',
          burger: 'tasy',
          shake: false
        },
        'is': 1
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      var query = {
        chic: {
          fil: 3
        }
      };
      result = yield this.instance.execQuery(key, query);
    });

  });
  
});