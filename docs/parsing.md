Parsing Results
===
Parsing results is also possible with dimebox:
```
dimebox parse HEAD
```
This will extract results from the last experiment. By default, the parser that will be used is the ```default-key-value``` parser, which expects the result files to have a specific output format for data that is to be extracted.

As an example, consider that there are two output files:

```
$ cat test-0-1
dbx.kv p: 1
dbx.kv k: 0
dbx.kv time: 0.09

$ cat test-0-2
dbx.kv p: 2
dbx.kv k: 0
dbx.kv time: 0.05
```

The special ```dbx.kv``` phrase indicates that a line contains a key-value pair that should be extracted. If we call ```dimebox parse``` on this experiment set, we will receive a structured row-oriented format of data:

```
$ dimebox parse HEAD
p k time
1 0 0.09
2 0 0.05
```

Aggregation
---
By default, it is assumed that each output file contains only unique keys. Sometimes, however, it is useful to output multiple values of the same metric. For example, we may want to output several observations for time:

```
$ cat test-0-1
dbx.kv p: 1
dbx.kv time: 0.09
dbx.kv time: 0.092
dbx.kv time: 0.088
```

In order to aggregate this information into a mean, we can use the `--agg` flag:

```
$ dimebox parse --agg HEAD
p time_mean time_conf
1 0.09 0.00163
```

Tags
---
Sometimes, executables output results for what would be considered separate operations. For example, an executable might test two different algorithms. In this case, the outputs can be tagged and parsing will only return results for a given tag.

The phrase for each key-value pair would then be changed to ```dbx.kv.tag key:value```

When invoking parse, the specific tag can be specified from the command line:
```
dimebox parse HEAD --tag=mytag
```

Parsers
---

Parsing can be customized to extract information from output files. A parser can be a small JavaScript module that exports a single a function that receives a line from a file and outputs a key-value pair for that line, or false if that line does not contain any useful information.

A small example that extracts lines that contain the special phrase ```dbx.kv``` would look like the following:
```javascript
module.exports = line => {
  if (!line.match(/^dbx.kv/))
    return false

  const s = line.replace('dbx.kv', '').split(':')
  return {key: s[0], value: s[1]}
}
```

### Parser Return Value
In our example, we just return a key-value pair, but there are two other
possible return types (beyond `return false` for no data).

First consider the following types:
```typescript
type kv  = {key: string, value: string | number, tag?: string}
type obs = {kvs: (string | number)[][], tag?: string}
```

|Return type | Description|
|---|---|
|```kv```| A single key-value pair with an optional tag.|
|```obs```| An [observation](terminology.md#observation), where ```kvs``` is an array of `[key,value]` arrays. See [here](../lib/parsers/default-key-value.js#L33) for an example.|
|```kv[]```| An array of key-value pairs. Use this if there is more than one data point per line but it is not a standalone observation. |

### Parser Objects

A parser can also be written as a Javascript module that exports an object.
This way the parser can read any additional command-line arguments to `parse`
after the epoch.  Let's look at the the other built-in parser, `regex-parser`,
as an example of what this lets you do. For this example, assume your `HEAD`
has an output file with the given contents.

```
time: 1.23
memory = 42
```
You can use `regex-parser` with something like
```
dimebox parse -p regex-parser HEAD '^(time):\s*(.*)$' '^(memory)\s*=\s*(.*)$'
```
The  `regex-parser` assumes that you pass it a list of regexes that match the
key first and then the value. The first regex that matches the line is used.
The source code for `regex-parser` can be found [here](../lib/parsers/regex-parser.js).

#### Additional Functions

In addition to using command-line arguments, you can customize the parser behavior
by defining the following functions

|Function name | Description|
|---|---|
| ```onInit(string[])```  | Initialize the parser based on any command-line arguments. |
| ```onNewFile(string)``` | Given a relative filename, perform any cleanup or initialization before starting on a new file.|
| ```parseLine(string)``` | **Required**. Return a value for the line. See [above](#parser-return-value) for more details.|

Now let's assume we have a program that outputs a special header before any data of interest.
Modifying the example above to work with any special phrase would look like:
```javascript
module.exports = {

  // This function is called with the user args before we use the parser.
  // You don't have to provide this function if you don't want to.
  onInit: args => {
    this.startString = args.length > 0 ? args[0] : 'START OF OUTPUT'
    this.phrase      = args.length > 1 ? args[1] : 'dbx.kv'
  },

  // You can optionally provide a callback for starting a new file.
  // Like onInit() this is also optional but it's useful to reset/init parser state.
  onNewFile: file => {
    this.seenStart = false
  },

  // This is the only function you must have for custom parsers.
  // In this example, we only return data if we've seen the start string and it
  // matches our special phrase, e.g. 'dbx.kv'
  parseLine: line => {
    if (line.indexOf(this.startString) != -1)
      this.seenStart = true
    if (!this.seenStart || !line.match('^'+this.phrase))
      return false

    const s = line.replace(this.phrase, '').split(':')
    return {key: s[0], value: s[1]}
  }
}
```
