'use strict'

let yaml    = require('js-yaml'),
    fs      = require('fs'),
    moment  = require('moment'),
    vc      = require('./util/vc'),
    expfile = require('./util/expfile'),
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
function dumpYAML(exp, epoch) {
  fs.writeFile(`experiments/jobs/${epoch}/run.yml`, yaml.safeDump(exp, {flowLevel: 1}), (err) => { if (err) throw err });

  const vcInfo = vc()
  if (vcInfo)
    fs.writeFile(`experiments/jobs/${epoch}/vc.yml`, yaml.safeDump(vcInfo), (err) => { if (err) throw err });
}

function createJobFiles(template, exp) {
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

  dumpYAML(exp, epoch);

  log.info(epoch)
}


module.exports = function(machine, experiment) {
  // Read and parse expfile
  const exp = expfile.loadExpfile(experiment)

  // read machine vars
  let machineVars = require('./machine/' + machine);
  let jobTemplate = machineVars.template

  if (!exp.p) {
    log.error('Processor counts needs to be specified in expfile')
    process.exit(2)
  }

  createJobFiles(jobTemplate, exp)
}
