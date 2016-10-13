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

Parsing can be customized to extract information from output files. A parser is a small JavaScript module that exports a single a function that receives a line from a file and outputs a key-value pair for that line, or false if that line does not contain any useful information.

A small example that extracts lines that contain the special phrase ```dbx.kv``` would look like the following:
```javascript
module.exports = line => {
  if (!line.match(/^dbx.kv/))
    return false

  const s = line.replace('dbx.kv', '').split(':')
  return {key: s[0], value: s[1]}
}
```
