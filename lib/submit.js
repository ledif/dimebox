'use strict'

const fs = require('fs'),
      spawnSync = require('child_process').spawnSync,
      _ = require('underscore'),
      log = require('loglevel'),
      epochUtils = require('./util/epochs.js')


module.exports = function(machine, epoch, dryRun, staggered) {
  let machineVars = require('./machine/' + machine);
  let submitCmd = machineVars.submit

  // resolve actual epoch
  epoch = epochUtils.resolve(epoch)
  
  const jobFiles =  _.filter(
    fs.readdirSync(`${process.cwd()}/experiments/jobs/${epoch}`),
    file => { return file.includes('.job'); }
  )

  let prevJobid = "";

  jobFiles.map(file => {
    if (dryRun) {
      log.info("Would submit ", file);
    } else {
      let spawnArgs = []

      // Set up chain of dependence if staggered submission
      if (staggered && prevJobid.length > 0) {
        const dependTemplate = machineVars.submitArgs.depend
        spawnArgs.push(dependTemplate(prevJobid))
      }

      // Add filename to list of spawn args
      spawnArgs.push(`${process.cwd()}/experiments/jobs/${epoch}/${file}`)

      log.debug("Submitting ", spawnArgs.join(' '));

      let ret = spawnSync(submitCmd, spawnArgs)

      // If the command could not be run
      if (ret.error) {
        log.error("Error spawning job: ", ret.error)
        process.exit(1)
      // If the job submission returned an error
      } else if (ret.status > 0 || ret.stderr.toString().length > 1) {
        log.error(ret.stderr.toString())
        process.exit(1)
      // Job submitted succesfully, get job id
      } else {
        prevJobid = ret.stdout.toString().trim()
      }
    }
  })
 
 log.info(`Submitted ${jobFiles.length} files.`)
 log.info(epoch);
}

