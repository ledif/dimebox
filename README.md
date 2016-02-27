# dimebox
Create, launch and monitor batch jobs in high performance computing environments. Written in Node.js.

Getting Started
---
For a quick overview of how to get started read the following.
* [Installing](docs/install.md)
* [Getting started](docs/getting-started.md)

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


