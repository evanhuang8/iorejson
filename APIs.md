<a name="Rejson"></a>

## Rejson
**Kind**: global class  

* [Rejson](#Rejson)
    * [new Rejson()](#new_Rejson_new)
    * _instance_
        * [.connect()](#Rejson+connect) ⇒ <code>Promise</code>
        * [.set(key, path, value)](#Rejson+set) ⇒ <code>Promise</code>
        * [.get(key, path)](#Rejson+get) ⇒ <code>Promise</code>
        * [.mget(...key, path)](#Rejson+mget) ⇒ <code>Promise</code>
        * [.del(key, path)](#Rejson+del) ⇒ <code>Promise</code>
        * [.objkeys(key, path)](#Rejson+objkeys) ⇒ <code>Promise</code>
    * _static_
        * [.defaultOptions](#Rejson.defaultOptions) : <code>Object</code>
        * [.commands](#Rejson.commands) : <code>Array</code>

<a name="new_Rejson_new"></a>

### new Rejson()
Creates a Rejson instance

<a name="Rejson+connect"></a>

### rejson.connect() ⇒ <code>Promise</code>
Connect

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
<a name="Rejson+set"></a>

### rejson.set(key, path, value) ⇒ <code>Promise</code>
Set a JSON value

[JSON.SET](https://redislabsmodules.github.io/rejson/commands/#jsonset)

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
**Returns**: <code>Promise</code> - - A promise that will resolve to true when value is set  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the value |
| path | <code>string</code> | The path of the value |
| value | <code>object</code> | The value to set |

<a name="Rejson+get"></a>

### rejson.get(key, path) ⇒ <code>Promise</code>
Get a JSON value

[JSON.GET](https://redislabsmodules.github.io/rejson/commands/#jsonget)

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
**Returns**: <code>Promise</code> - - A promise that will resolve to the JSON object at key path, or null if not found  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the value |
| path | <code>string</code> | The path of the value |

<a name="Rejson+mget"></a>

### rejson.mget(...key, path) ⇒ <code>Promise</code>
Get multiple JSON values at the same time (for a given path)

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
**Returns**: <code>Promise</code> - - A promise that will resolve to an array of the JSON objects found at key paths  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| ...key | <code>string</code> | The key to get value for |
| path | <code>string</code> | The path of the value |

<a name="Rejson+del"></a>

### rejson.del(key, path) ⇒ <code>Promise</code>
Delete a JSON value (or value at a specific path)

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
**Returns**: <code>Promise</code> - - A promise that will resolve to true when value is deleted  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the value |
| path | <code>string</code> | The path of the value |

<a name="Rejson+objkeys"></a>

### rejson.objkeys(key, path) ⇒ <code>Promise</code>
Get the object keys for a JSON value (for a given path)

**Kind**: instance method of <code>[Rejson](#Rejson)</code>  
**Returns**: <code>Promise</code> - - A promise that will resolve to array of keys at path  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the value |
| path | <code>string</code> | The path of the value |

<a name="Rejson.defaultOptions"></a>

### Rejson.defaultOptions : <code>Object</code>
Default options

**Kind**: static property of <code>[Rejson](#Rejson)</code>  
<a name="Rejson.commands"></a>

### Rejson.commands : <code>Array</code>
Commands

**Kind**: static property of <code>[Rejson](#Rejson)</code>  
