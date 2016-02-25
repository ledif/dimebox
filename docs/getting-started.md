Getting started
===================
This document should provide a simple example to get up and running with dimebox to perform a simple experimental setup of an MPI program

Initialization
----
To create your first experiment testbed, run dimebox init in the same directory as your executable.

```
dimebox init
```
This will create the directory structure for your experimental setup:
```
.
├── experiments
│   ├── jobs
│   ├── results
│   └── simple.yml
```

The ```jobs``` directory will store all of the generated job files and the ```results``` directory will store the output from your jobs' execution. Each experiment is defined by a YAML file which gives various configuration options, such as the number or processor counts, commands to be run in each job and a list of parameters to perform an exhaustive study of.

In our example, our YAML configuration is simple:
```
name: heat
desc: Heat equation for various processor counts

p: [1, 2, 4, 8, 16, 32]

cmds:
  - heat: ./heat
```

Generation
----
Next, we want to generate the job files for this experiment:
```
dimebox generate -m rain experiments/simple.yml
```
In this example, we will generate files for our predefined machine named "rain," but we will see how to define machine configurations later.

This command will have generated job files in our jobs folder in a specific epoch. The epoch is just the datetime in which the experiment was generated.

```
.
├── jobs
│   └── 20160225-124457
│       ├── heat-16.job
│       ├── heat-1.job
│       ├── heat-2.job
│       ├── heat-32.job
│       ├── heat-4.job
│       ├── heat-8.job
│       └── run.yml
├── results
└── simple.yml
```
Submission
---
We can next launch the jobs we just created
```
dimebox submit HEAD
```
Here, the keyword HEAD is a special epoch representing the last generated experiment. Our jobs should be submitted to the batch submission system and be queued for future processing.

All of the results files should be stored in the ```results``` directory for the given epoch. There will be a result file for every combination of processor count, optional argument and command specified in the YAML file. In addition, each job will print its standard output and standard error to special directories in the epoch for diagnosing errors.

After some time, our jobs will have finished and populated the results directory:
```
.
├── results
│   └── 20160225-124457
│       ├── heat-1
│       ├── heat-16
│       ├── heat-2
│       ├── heat-32
│       ├── heat-4
│       ├── heat-8
│       ├── run.yml
│       ├── stderr
│       │   ├── heat-1.131693.sdb.err
│       │   ├── heat-16.131694.sdb.err
│       │   ├── heat-2.131695.sdb.err
│       │   ├── heat-32.131696.sdb.err
│       │   ├── heat-4.131697.sdb.err
│       │   └── heat-8.131698.sdb.err
│       └── stdout
│           ├── heat-1.131693.sdb.out
│           ├── heat-16.131694.sdb.out
│           ├── heat-2.131695.sdb.out
│           ├── heat-32.131696.sdb.out
│           ├── heat-4.131697.sdb.out
│           └── heat-8.131698.sdb.out

```
Summarization
---
Keeping track of your experiments is one of the main benefits of using dimebox. Using the summary tool, it is easy to tell at a glance what has run and gives some context to your experiments:

```
dimebox summary
```
This will print a list of your experiments along with a small overview for each, including when it was generated, a description of the experiment, how many results are expected, how many were found and how many failed.
```
┌─────────────────┬───────┬───────┬───────┬────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Epoch           │ #     │ files │ fail  │ Description                                                                                        │
│ 20160225-125008 │ 4     │ 4     │ 4     │ Introducing a bug for test purposes                                                                │
│ 20160225-124722 │ 1     │ 1     │ 0     │ Only 128 processors                                                                                │
│ 20160225-124457 │ 6     │ 6     │ 0     │ Heat equation for various processor counts                                                         │
└─────────────────┴───────┴───────┴───────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
In addition, summarizing an individual epoch will provide the YAML file that was used to generate the jobs, giving you a look into the parameters that were used to run the experiments.

> **Note:** In the future, other information will be provided including the git commit hash for the code used to compile the executable (along with a diff of the uncommitted changes) along with the binary itself for true reproducibility.

More complex examples
---

The previous example was fairly straightforward, but it is possible to create an experiment set that contains a large amount of parameter exploration:

```
name: complex
desc: Testing an exhaustive study of parameters

p: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

optargs: 
  tau: [1, 16, 64, 256, 4096]
  k: [0, 1, 2, 4, 8, 16, 32]
  r: [0.0, 0.2, 0.4, 0.8, 1.0]
   
cmds:
  - stats: ./stats 1048576 4 $r $tau $k 1 0
  - perf: ./perf 1048576 4 $r $tau $k 1 0

```
In this example, we have a large amount of parameters that we would like to test. There are 10 processor counts, three optional arguments (two of which have 5 choices and one that has 7 choices) and two commands to run. This gives a total of 3500 configurations. Imagine having to manage the job creation, submission and summarization for this experiment alone!