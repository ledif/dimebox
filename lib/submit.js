'use strict'

const fs = require('fs'),
      spawnSync = require('child_process').spawnSync,
      _ = require('underscore'),
      log = require('loglevel'),
      dirs = require('./util/dirs'),
      config  = require('./config'),
      epochUtils = require('./util/epochs')

// Split a list into n/k lists, each of size k
function groupByK(list, k) {
  const n = list.length
  return _.chain(list).groupBy((element, index) => {
    return Math.floor(index/k);
  }).toArray().value();
}

// Call job submission and return the ID of the job that was spawned
function submitJob(cmd, args) {
  let ret = spawnSync(cmd, args)

  // If the command could not be run
  if (ret.error) {
    log.error("Error spawning job: ", ret.error)
    process.exit(1)
  // If the job submission returned an error
  } else if (ret.status > 0 || ret.stderr.toString().length > 1) {
    log.error(ret.stderr.toString())
    process.exit(1)
  }

  // Job submitted succesfully, get job id
  return ret.stdout.toString().trim()
}

const Submitter = {
  // Simulate submitting jobs
  dryRun: function(jobs, machine) {
    jobs.map(file => { log.info("Would submit", file) })
  },
 
  // Submit all jobs one after another
  all: function(jobs, machine) {
    jobs.map(file => {
      log.debug("Submitting ", file);
      submitJob(machine.submit, [file])
    })
  },

  // Submit jobs and set up dependences between them
  staggered: function(jobs, machine, batchSize) {
    let prevJobs = [];

    // Batch job list by batchSize
    groupByK(jobs, batchSize).map(batch => {
      let currentJobs = []

      for (let i = 0; i < batch.length; i++) {
        const file = batch[i]

        let spawnArgs = []

        // Don't set up dependences for first batch
        if (prevJobs.length > 0) {
          const dependTemplate = machine.submitArgs.depend
          // This job's predecessor is the i'th job submitted in last round
          const pred = prevJobs[i]
          spawnArgs.push(dependTemplate(pred))
        }

        // Add filename to list of spawn args
        spawnArgs.push(file)

        log.debug("Submitting ", spawnArgs.join(' '));

        // Submit job and set its id in the list of current ids
        const id = submitJob(machine.submit, spawnArgs)
        currentJobs.push(id)
      }
      // Swap this batch's job list as the dependence list for the next batch
      prevJobs = currentJobs
    })
  }
}

module.exports = function(machine, epoch, dryRun, staggered, batchSize) {
  let machineConf = config.machine(machine)

  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)
  
  const jobFiles =  _.chain(fs.readdirSync(dirs.jobs(epoch)))
    .filter(file => { return file.includes('.job'); })
    .map(file => dirs.jobs(epoch, file)).value()

  // Choose the submission policy
  let submitter = {}
  if (dryRun) {
    submitter = Submitter.dryRun
  } else if (staggered) {
    submitter = (j, m) => Submitter.staggered(j, m, batchSize)
  } else {
    submitter = Submitter.all
  }

  submitter(jobFiles, machineConf)

  log.info(`Submitted ${jobFiles.length} files.`)
  log.info(epoch);
}

