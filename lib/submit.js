'use strict'

const fs = require('node-fs-extra'),
      spawnSync = require('child_process').spawnSync,
      _ = require('lodash'),
      log = require('loglevel'),
      dirs = require('./util/dirs'),
      config  = require('./config'),
      epochUtils = require('./util/epochs')

/**
 * Call job submission command and return the ID of the job that was spawned
 * @param {Array} jobs List of job files
 * @param {Object} machine Machine configuration
 * @return {String} ID of the job in the batch system
 */
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
  /**
   * Simulate submitting jobs
   * @param {Array} jobs List of job files
   * @param {Object} machine Machine configuration
   */
  dryRun: function(jobs, machine) {
    jobs.map(file => { log.info("Would submit", file) })
  },
 
  /**
   * Submit all jobs one after another
   * @param {Array} jobs List of job files
   * @param {Object} machine Machine configuration
   * @return {Array} list of objects representing spawned jobs
   */
  all: function(jobs, machine) {
    return _.map(jobs, file => {
      log.debug("Submitting ", file);
      return {
        job: file,
        id: submitJob(machine.submit, [file])
      }
    })
  },

  /**
   * Submit jobs and set up dependences between them
   * @param {Array} jobs List of job files
   * @param {Object} machine Machine configuration
   * @param {number} batchSize Number of jobs that should be scheduled at once
   */
  staggered: function(jobs, machine, batchSize) {
    let allJobs = [];
    let prevJobs = [];

    // Batch job list by batchSize
    _(jobs).chunk(batchSize).each(batch => {
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
        allJobs.push({job: file, id: id})
      }
      // Swap this batch's job list as the dependence list for the next batch
      prevJobs = currentJobs
    })

    return allJobs
  }
}

/**
 * Dump information about the spawned jobs
 * @param {String} epoch Non-symbolic epoch
 * @param {Array} jobs Information about the jobs to dump
 */
function dump(epoch, jobs) {
  const fname = dirs.jobs(epoch, '.submitted.json')
  fs.outputJSONSync(fname, jobs, {spaces:5})
}

/**
 * Submit all jobs for the given epoch
 */
module.exports = function(opt) {
  let machineConf = config.machine(opt.machine)

  // Resolve symbolic epoch
  const epoch = epochUtils.resolve(opt.epoch)

  // Abort if this has already been submitted
  if (!opt.force && fs.existsSync(dirs.jobs(epoch, '.submitted.json'))) {
    log.error("This experiment has already been submitted (use --force to overide).")
    log.error(`note: run 'dimebox generate experiments/jobs/${epoch}/run.yml' to generate a new experiment from the same configuration.`)
    process.exit(1)
  }
  
  const jobFiles = _(fs.readdirSync(dirs.jobs(epoch)))
    .filter(file => { return file.includes('.job'); })
    .map(file => dirs.jobs(epoch, file)).value()

  // Choose the submission policy
  let submitter = {}
  if (opt.dryRun) {
    submitter = Submitter.dryRun
  } else if (opt.staggered) {
    submitter = (j, m) => Submitter.staggered(j, m, opt.batchSize)
  } else {
    submitter = Submitter.all
  }

  const spawned = submitter(jobFiles, machineConf)
  dump(epoch, spawned)

  log.info(`Submitted ${jobFiles.length} files.`)
  log.info(epoch);
}

