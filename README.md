# dimebox
[![Build Status](https://travis-ci.org/ledif/dimebox.svg?branch=master)](https://travis-ci.org/ledif/dimebox)

Create, launch and monitor batch jobs in high performance computing environments. Written in Node.js.

Getting Started
---
For a quick overview of how to get started read the following.
* [Installing](docs/install.md)
* [Getting started](docs/getting-started.md)

Why Use Dimebox
---
A question you may have is "I already have my own scripts; why do I need this crap?"

1. **Sane experiment organization**

   Often when performing iterative development and experimentation, it becomes easy to overwrite your previous experiment's job files and results, or become confused about the origin of a certain set of results.
  
   Dimebox organizes your experiments in a very structured way, leaving little room for ambiguity about the parameters used in your experiment, the code that compiled the binary, or which job files were run to obtain which results. It also provides the ability to give short descriptions of each experiment, giving context into why the experiment was run and potentially a summary of its findings.

2. **Platform independence**

   Experiments in dimebox are described using a platform-independent experiment file. This makes it trivial to take an experiment that was designed on one machine to easily be run on an entirely different machine. No need to write a machine-specific script for generating new job files.

3. **Reproducibility**

   One of the cornerstones of experimental science is the ability to reproduce one's experiments. Dimebox provides all of the necessary information to reproduce any given experiment, including version control information (along with diffs) of the code used to compile the binary, the parameters used for the experiments and the job files themselves. In the future, the binary will also be included for even deeper reproducibility capabilities.
  
Usage
------

Initialize dimebox experimental setup:
```
dimebox init
```

This will create the experimental scaffolding in experiments/ including jobs/ and results/

```
dimebox generate experiments/example.yml
```

This will generate jobs for the example experiment.

```
dimebox submit HEAD
```

Submit all of the jobs just generated to the batch system to be queued and processed.


