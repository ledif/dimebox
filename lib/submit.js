'use strict'

const fs = require('fs'),
      spawn = require('child_process').spawn,
      _ = require('underscore'),
      log = require('loglevel'),
      epochUtils = require('./util/epochs.js')


module.exports = function(machine, epoch, dryRun) {
  let machineVars = require('./machine/' + machine);
  let submitCmd = machineVars.submit

  // resolve actual epoch
  epoch = epochUtils.resolve(epoch)
  
  const jobFiles =  _.filter(
    fs.readdirSync(`${process.cwd()}/experiments/jobs/${epoch}`),
    file => { return file.includes('.job'); }
  )

  jobFiles.map(file => {
    if (dryRun) {
      log.info("Would submit ", file);
    } else {
      log.debug("Submitting ", file);
      var ps = spawn(submitCmd, [`${process.cwd()}/experiments/jobs/${epoch}/${file}`])
      ps.stderr.on('data', (data) => {
        log.error(data.toString())
      })
    }

  })
 
 log.info(`Submitted ${jobFiles.length} files.`)
 log.info(epoch);
}

