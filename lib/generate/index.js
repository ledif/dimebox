'use strict'

let yaml    = require('js-yaml'),
    fs      = require('fs'),
    moment  = require('moment'),
    vc      = require('./vc'),
    expfile = require('../util/expfile'),
    jobs    = require('./jobs'),
    dirs    = require('../util/dirs'),
    config  = require('../config'),
    machine = require('./machine'),
    log     = require('loglevel')

// Create dir for jobfiles and results
function createDirectories(epoch) {
  const subdirs = [
    dirs.jobs(epoch),
    dirs.results(epoch),
    dirs.results(epoch, "stderr"),
    dirs.results(epoch, "stdout"),
    dirs.results(epoch, ".fail"),
    dirs.results(epoch, ".done"),
    dirs.results(epoch, ".started"),
    dirs.results(epoch, ".md")
  ]

  subdirs.map(dir => { fs.mkdirSync(dir); })
}

// Dump the expfile and version control info
function dumpYAML(exp, epoch, printVC) {
  fs.writeFile(dirs.jobs(epoch, "run.yml"), yaml.safeDump(exp, {flowLevel: 1}), (err) => { if (err) throw err });

  // Dump version control information
  if (printVC) {
    const vcInfo = vc(exp)
    if (vcInfo)
      fs.writeFile(dirs.jobs(epoch, "vc.yml"), yaml.safeDump(vcInfo), (err) => { if (err) throw err });
  }

  // Dump machine information
  const machineInfo = machine()
  fs.writeFile(`experiments/jobs/${epoch}/machine.yml`, yaml.safeDump(machineInfo), (err) => { if (err) throw err });
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
  const machineConfig = config.machine(machine);

  createJobFiles(machineConfig.template, exp, vc)
}
