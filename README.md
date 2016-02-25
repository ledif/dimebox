# dimebox
Create, launch and monitor batch jobs in high performance computing environments.

Requires
------
 - node.js


Traditional installation
```
npm install
```

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
dimebox submit
```

Submit all of the jobs just generated to the batch system to be queued and processed.
