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

    it('#objlen', function*() {
      var result;
      var key = getKey('test_objlen');
      var path = '.';
      var value = {
        foo: 'bar',
        chic: {
          fil: 'a',
          burger: 'tasy',
          shake: false,
          joker: null
        },
        'is': 1
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      length = yield this.instance.objlen(key, path);
      expect(length).to.deep.equal(3);
      length = yield this.instance.objlen(key, '.chic');
      expect(length).to.deep.equal(4);
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
        d: 'skip',
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
      result = yield this.instance.numincrby(key, '.c', -3.75);
      expect(result).to.equal(0.25);
      try {
        result = yield this.instance.numincrby(key, '.d', 0.4);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      try {
        result = yield this.instance.numincrby(key, '.e', 0.4);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.numincrby(key, '.f.g', 32);
      expect(result).to.equal(36);
      try {
        result = yield this.instance.numincrby(key, '.a', 'hello');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
    });

    it('#nummultby', function* () {
      var result;
      var key = getKey('test_nummultby');
      var path = '.';
      var value = {
        a: 1,
        b: 2.333333,
        c: 4,
        d: 'skip',
        e: true,
        f: {
          g: 4
        }
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.nummultby(key, '.a', 2);
      expect(result).to.equal(2);
      result = yield this.instance.nummultby(key, '.b', 1.333333);
      expect(result).to.equal(1.333333 * 2.333333);
      result = yield this.instance.nummultby(key, '.c', -3.75);
      expect(result).to.equal(-15);
      try {
        result = yield this.instance.nummultby(key, '.d', 0.4);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      try {
        result = yield this.instance.nummultby(key, '.e', 0.4);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.nummultby(key, '.f.g', 32);
      expect(result).to.equal(128);
      try {
        result = yield this.instance.nummultby(key, '.a', 'hello');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
    });

    it('#strappend', function* () {
      var result;
      var key = getKey('test_strappend');
      var path = '.';
      var value = {
        a: 'hello',
        b: 1,
        c: '',
        d: false,
        e: {
          f: 'world'
        }
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.strappend(key, '.a', 'ma2p');
      expect(result).to.equal(9);
      try {
        result = yield this.instance.strappend(key, '.b', 'hello');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.strappend(key, '.c', 'averylongstring');
      expect(result).to.equal(15);
      try {
        result = yield this.instance.strappend(key, '.d', 'hello');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      try {
        result = yield this.instance.strappend(key, '.e', 'hello');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.strappend(key, '.e.f', 'bayless');
      expect(result).to.equal(12);
    });

    it('#strlen', function* () {
      var result;
      var key = getKey('test_strlen');
      var path = '.';
      var value = {
        a: 'hello',
        b: 1,
        c: '',
        d: false,
        e: {
          f: 'world'
        }
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.strlen(key, '.a');
      expect(result).to.equal(5);
      try {
        result = yield this.instance.strlen(key, '.b');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.strlen(key, '.c');
      expect(result).to.equal(0);
      try {
        result = yield this.instance.strlen(key, '.d');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      try {
        result = yield this.instance.strlen(key, '.e');
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.strlen(key, '.e.f');
      expect(result).to.equal(5);
    });

    it('#arrappend', function* () {
      var result;
      var key = getKey('test_arrappend');
      var path = '.';
      var value = {
        a: 'hello',
        b: [1, 2, 3],
        c: {
          d: ['ello']
        }
      };
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      try {
        result = yield this.instance.arrappend(key, '.a', 1);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.arrappend(key, '.b', 4, 5, 6);
      expect(result).to.equal(6);
      items = yield this.instance.get(key, '.b');
      expect(items).to.deep.equal([1, 2, 3, 4, 5, 6]);
      result = yield this.instance.arrappend(key, '.b', 'foo', true, null);
      expect(result).to.equal(9);
      items = yield this.instance.get(key, '.b');
      expect(items).to.deep.equal([1, 2, 3, 4, 5, 6, 'foo', true, null]);
      try {
        result = yield this.instance.arrappend(key, '.c', 1);
        throw 1;
      } catch (err) {
        if (err === 1) {
          throw new Error('Expecting error but it succeeded!');
        }
      }
      result = yield this.instance.arrappend(key, '.c.d', 'foo', true, null);
      expect(result).to.equal(4);
      items = yield this.instance.get(key, '.c.d');
      expect(items).to.deep.equal(['ello', 'foo', true, null]);
      var key = getKey('test_arrappend_2');
      var path = '.';
      var value = ['hello'];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.arrappend(key, '.', 'foo', true, null);
      expect(result).to.equal(4);
      items = yield this.instance.get(key, '.');
      expect(items).to.deep.equal(['hello', 'foo', true, null]);
    });

    it('#arrindex', function* () {
      var result;
      var key = getKey('test_arrindex');
      var path = '.';
      var value = ['hello', 'world', true, 1, 3, null, false];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      for (var i in value) {
        var item = value[i];
        result = yield this.instance.arrindex(key, path, item);
        expect(result).to.equal(parseInt(i));
      }
    });

    it('#arrinsert', function* () {
      var result;
      var key = getKey('test_arrinsert');
      var path = '.';
      var value = ['hello', 'world', true, 1, 3, null, false];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.arrinsert(key, path, 1, 'foo');
      expect(result).to.equal(8);
      result = yield this.instance.get(key, path);
      expect(result).to.deep.equal(['hello', 'foo', 'world', true, 1, 3, null, false]);
    });

    it('#arrlen', function* () {
      var result;
      var key = getKey('test_arrlen');
      var path = '.';
      var value = ['hello', 'world', true, 1, 3, null, false];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.arrlen(key, path);
      expect(result).to.equal(7);
    });

    it('#arrlen', function* () {
      var result;
      var key = getKey('test_arrlen');
      var path = '.';
      var value = ['hello', 'world', true, 1, 3, null, false];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.arrpop(key, path, 2);
      expect(result).to.equal(true);
      result = yield this.instance.arrpop(key, path, 2);
      expect(result).to.equal(1);
    });

    it('#arrtrim', function* () {
      var result;
      var key = getKey('test_arrtrim');
      var path = '.';
      var value = ['hello', 'world', true, 1, 3, null, false];
      result = yield this.instance.set(key, path, value);
      expect(result).to.be.true;
      result = yield this.instance.arrtrim(key, path, 2, 5);
      expect(result).to.equal(4);
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