'use strict'

let yaml    = require('js-yaml'),
    fs      = require('fs'),
    moment  = require('moment'),
    vc      = require('./vc'),
    expfile = require('../util/expfile'),
    jobs    = require('./jobs'),
    log     = require('loglevel')

// Create dir for jobfiles and results
function createDirectories(epoch) {
  fs.mkdirSync(`experiments/jobs/${epoch}`)
  fs.mkdirSync(`experiments/results/${epoch}`)
  fs.mkdirSync(`experiments/results/${epoch}/stderr`)
  fs.mkdirSync(`experiments/results/${epoch}/stdout`)
}

// Dump the expfile and version control info
function dumpYAML(exp, epoch, printVC) {
  fs.writeFile(`experiments/jobs/${epoch}/run.yml`, yaml.safeDump(exp, {flowLevel: 1}), (err) => { if (err) throw err });

  // Dump version control information
  if (printVC) {
    const vcInfo = vc()
    if (vcInfo)
      fs.writeFile(`experiments/jobs/${epoch}/vc.yml`, yaml.safeDump(vcInfo), (err) => { if (err) throw err });
  }
}

function createJobFiles(template, exp, vc) {
  const epoch = moment().format('YYYYMMDD-HHmmss')

  createDirectories(epoch);
  
  const generated = jobs.generateJobs(template, exp, epoch)

  generated.map(job => {
    fs.writeFile(job.filename, job.contents, (err) => {
      if (err) {
        log.error("Could not write job", job.filename, err.message)
        process.exit(1)
      }
    });
  });

  dumpYAML(exp, epoch, vc);

  log.info(epoch)
}


module.exports = function(machine, experiment, vc) {
  // Read and parse expfile
  const exp = expfile.loadExpfile(experiment)

  // Read machine config
  const machineConfig = require('../machine/' + machine);

  createJobFiles(machineConfig.template, exp, vc)
}
