'use strict'

const fs = require('node-fs-extra'),
      spawnSync = require('child_process').spawnSync,
      _ = require('lodash'),
      log = require('loglevel'),
      dirs = require('./util/dirs'),
      config  = require('./config'),
      epochUtils = require('./util/epochs')
/**
 * Read job information from stored file
 * @param {String} epoch Non-symbolic epoch
 * @returns {Array} Information about the jobs that were submitted
 */
function read(epoch) {
  let jobs = []
  try {
    const fname = dirs.jobs(epoch, '.submitted.json')
    jobs = fs.readJSONSync(fname, jobs, {spaces:5})

  } catch (e) {
    log.error("Error reading job information file. Experiment might not have been submitted.")
    process.exit(1)
  }
  return jobs
}

/**
 * Cancel a single job
 * @param {String} job ID of job that was killed
 * @param {Object} machine Machine configuration
 */
function cancel(job, machine) {
  let ret = spawnSync(machine.kill, [job])

  // If the command could not be run
  if (ret.error) {
    log.error("Error killing ", job, ret.error)
    return false
  // If the kill returned an error
  } else if (ret.status > 0 || ret.stderr.toString().length > 1) {
    log.error("Can't kill ", job, ret.stderr.toString())
    return false
  }

  console.log("Killed", job)
  return true
}

/**
 * Kill all jobs for the given epoch
 */
module.exports = function(opt) {
  const machine = config.machine(opt.machine)

  // Resolve symbolic epoch
  const epoch = epochUtils.resolve(opt.epoch)

  // Get job information stored on fs
  const jobs = read(epoch)
  
  // Kill all jobs and count how many were successfully killed
  const killed = _(jobs)
    .map(job => cancel(job.id, machine))
    .compact()
    .value()
    .length

  log.info(`Killed ${killed} jobs.`)
}
