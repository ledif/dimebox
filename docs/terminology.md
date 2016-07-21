# Terminology

## Experimental organization

Experiments are organized in a structured way using dimebox.

### Experiment set

The collection of all of your experiments for a project is called an _experiment set_. In dimebox, the `experiments` directory directly corresponds with an experiment set.

### Experiment

Within an experiment set, there are multiple _experiments_. Each experiment is uniquely identified by an _epoch_. An epoch is a datetime formatted in YYMMDD-HHMMSS (e.g., `20160715-141343`). Currently, experiments cannot be generated faster than one per second.

Experiments are generated using a YAML file called an _expfile_.

### Result

Each experiment will contain multiple _result_ files. By default, these are stored in `experiments/results/$epoch`. There will be one result file for every unique combination of processor count, depth count, optional arguments, weak arguments and command that is specified in the expfile.

For example, consider the following expfile:
```yml
p: [8, 16]

optargs:
  k: [0, 1]
  j: [10, 20]

cmds:
  foo: ./foo $k $j
  bar: ./bar $k $j
```

At completion of this experiment, there will be 16 result files in the results directory:

```
foo-0-10-8
foo-0-20-8
foo-1-10-8
foo-1-20-8
foo-0-10-16
foo-0-20-16
foo-1-10-16
foo-1-20-16
bar-0-10-8
bar-0-20-8
bar-1-10-8
bar-1-20-8
bar-0-10-16
bar-0-20-16
bar-1-10-16
bar-1-20-16
```

Within each result file is the output of the execution of the command with that particular configuration.

### Observation

A result will contain one or more _observations_. An observation is used in the same sense as in the [Tidy Data](http://vita.had.co.nz/papers/tidy-data.pdf) model.

Observations can be extracted from a result using the `dimebox parse` command. For simplicity, we will assume the use of the default parser.

The program can emit information about observations by printing `dbx.kv key: value` in its output. In this example, `key` will form a column in the parsed output and `value` will be one cell of a row. 

Consider the same experiment as above. Imagine that the contents of one of the results is as follows:

```
$ cat foo-0-10-16
dbx.kv size: 1024
dbx.kv time: 0.214469
dbx.kv error: 0.00979
```

The entire contents of this file therefore represents a single observation. If we were to parse this experiment, we would see the following in the output:

```
cmd	p	k	j	size	time	error
foo	16	0	10	1024	0.214496	0.00979
...
```

A program may want to record multiple observations per run. In this case, the `dbx.obs` keyword can be used to distinguish between multiple observations. For example, consider that the updated result file contains the following content:

```json
$ cat foo-0-10-16
dbx.kv size: 1024
dbx.obs {"algo": "exact", "time": 0.650415, "error": 0}
dbx.obs {"algo": "approx", "time": 0.214469, "error": 0.00979}
```

This program ran two versions of an algorithm: an approximate version and an exact version. The exact version executed in more time with no error while the approximate version finished in less time with some error. If we parse this experiment now, we may expect to see the observations collected as follows:

```
cmd	p	k	j	size	algo	time	error
foo	16	0	10	1024	approx	0.214496	0.00979
foo	16	0	10	1024	exact	0.650415	0
...
```
Note that any freestanding key-value pair is simply appended to all observations in the result.
