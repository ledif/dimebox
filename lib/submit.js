'use strict'

const fs = require('fs'),
      spawn = require('child_process').spawn,
      _ = require('underscore')


module.exports = function(machine, experiment) {
  let machineVars = require('./templates/' + machine);
  let submitCmd = machineVars.submit

  let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
  const epoch = epochs[0]

  const jobfiles = fs.readdirSync(`${process.cwd()}/experiments/jobs/${epoch}`)

  _.filter(jobfiles, (file) => { return file.includes('.job'); }).map(file => {
    spawn(submitCmd, [`${process.cwd()}/experiments/jobs/${epoch}/${file}`])
  })
 
 console.log(epoch);
}

