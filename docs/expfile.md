Experiment files
===

In dimebox, experiments are specified with YAML files called expfiles. This document will explain the possible fields used to create an expfile.

Name and description
---
These two fields together exist to make it easy to identify the kind of experiment that you will be running. Example:
```yml
name: my_experiment
desc: Testing various parameters of k on quality of result
```
The name field is used when computing each job name, as well as the names of the job files. The name should not contain any characters that are unwieldy to deal with in filenames, such as spaces and tabs.

The description field allows the user to give a more detailed description about the kind of experiment that will be run. This is an opportunity to provide detail at high level about what parameters are used, what changes to the code were made, and other information that will be helpful when looking at how this experiment differs from the others that have run. This field's sole purpose is to make it easy for the user to understand the context of this experiment when returning to it later.

Processor counts
---
This field specifies which processor counts this experiment will use. Example:
```yml
p: [1, 2, 4, 8, 16, 32]
```
There will be one job created for each processor count.

Commands
---
The commands object specifies which executables will be run and with which parameters. Example:
```yml
cmds:
  foo: ./myexe 1000
   bar: ./yourexe 1000
```
  As the commands have multiple key-value pairs, this allows for a job to run multiple executables. Each executable's output will be stored in a different file, where the filename is derived from the keys in this object. In our example, the output of myexe will be stored in a file starting with 'foo' and the output of yourexe will be in a file starting with 'bar.'

In each command, arguments that are specified in ```optargs``` or ```weakargs``` will be available for use, with the name of the argument preceded by a dollar sign (e.g., `$arg`).

Arguments
---
There are two kinds of arguments in dimebox, optargs and weakargs

####optargs
This field allows the user to specify a matrix of arguments that will be used to create jobs. Example:

```yml
optargs: 
  tau: [1, 16, 64, 256, 4096]
  k: [0, 1, 2, 4, 8]
```
In this example, there are two different arguments, each with 5 possibilities, allowing for 25 different combinations of arguments. These arguments can be specified in a command like so:
```yml
cmds:
  foo: ./myexe $tau $k
```
####weakargs

Weak arguments are arguments that depend on the processor count `p`. Example:
```yml
weakargs:
  scale: 11 + Math.log2(p)
```
This will create a `$scale` argument whose value depends on the value of p. Note that each weakarg is simply a JavaScript expression that will be evaluated during  generation. If there are any errors in this expression, or if it does not generate a number or string, then generation will fail.

Queues
---
The q field exists to specify queues for your jobs. Example:
```yml
q:
  small: 16
  med: 128
  big: 512
```
The q field should be key-value pairs of queue names and processor counts. For each job with a given processor count, a queue will be computed for that job based on the smallest queue that is less than or equal to the processor counts given in q.

In our example, a job with 16 processors will be assigned to the small queue, whereas a job with 32 processors will be assigned to the med queue. If a processor count higher than 512 is specified, generation will abort.

Environment variables
---

Environment variables can be specified with the env field. For example, if you wanted to specify `export BG_MAPCOMMONHEAP=1`, you would add the following to your expfile:
```yml
env:
  BG_MAPCOMMONHEAP: 1
```

Trials
---
You can specify that the commands in your experiment be run multiple times using the trials field:
```yml
trials: 32
```

This will run the commands 32 times and the result of each command will be appended to your output file.

Raw headers and flags
---
If dimebox doesn't include support for a flag that should be in your job file, it's possible to explicitly specify a flag that should be in a job's header, or called with the `MPIRUN` command:

```yml
raw:
  headers: ['--myheader ${p*5}']
  runFlags: ["-S ${Math.log2(p)}"]
```

This will result in a job, where p=8, that may include the following:

```
#PBS --myheader 40
mpirun -np 8 -S 3 ...
```

You can evaluate expressions inside of `${}`, where the values of p and depth for a given job are available. 

Prologue and epilogue
---
Commands that happen at the beginning and end of your job can be specified with the prologue and epilogue fields. Example:

```yml
prologue: 'echo "Subject: starting job" | sendmail -v my@email.com'
epilogue: rm core.*
```

Workspaces
---
Specifying a workspace in your expfile will allow jobs to be run in their own isolated directory. Example:
```yml
workspace:
  links: [myexe]
```
The nested links field should provide an array of symbolic links that will be avaiable in the isolated directory. Links are relative to the current working directory.
