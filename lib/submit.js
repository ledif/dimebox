'use strict'

const fs = require('fs'),
      spawn = require('child_process').spawn,
      _ = require('underscore'),
      log = require('loglevel')


module.exports = function(machine, epoch, dryRun) {
  let machineVars = require('./machine/' + machine);
  let submitCmd = machineVars.submit

  if (!epoch) {
    let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
    epoch = epochs[0]
  }

  const jobFiles =  _.filter(
    fs.readdirSync(`${process.cwd()}/experiments/jobs/${epoch}`),
    file => { return file.includes('.job'); }
  )

  jobFiles.map(file => {
    if (dryRun) {
      log.info("Would submit ", file);
    } else {
      log.debug("Submitting ", file);
      spawn(submitCmd, [`${process.cwd()}/experiments/jobs/${epoch}/${file}`])
    }

  })
 
 log.info(`Submitted ${jobFiles.length} files.`)
 log.info(epoch);
}

