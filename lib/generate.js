'use strict'

let yaml    = require('js-yaml'),
    fs      = require('fs'),
    _       = require('underscore'),
    moment  = require('moment'),
    vc      = require('./util/vc'),
    expfile = require('./util/expfile'),
    log     = require('loglevel')

function cartesianProductOf(xs) {
    return _.reduce(xs, function(a, b) {
        return _.flatten(_.map(a, function(x) {
            return _.map(b, function(y) {
                return x.concat([y]);
            });
        }), true);
    }, [ [] ]);
};

// Create dir for jobfiles and results
function createDirectories(epoch) {
  fs.mkdirSync(`experiments/jobs/${epoch}`)
  fs.mkdirSync(`experiments/results/${epoch}`)
  fs.mkdirSync(`experiments/results/${epoch}/stderr`)
  fs.mkdirSync(`experiments/results/${epoch}/stdout`)
}

function dumpYAML(exp, epoch) {
  fs.writeFile(`experiments/jobs/${epoch}/run.yml`, yaml.safeDump(exp, {flowLevel: 1}), (err) => { if (err) throw err });

  const vcInfo = vc()
  if (vcInfo)
    fs.writeFile(`experiments/jobs/${epoch}/vc.yml`, yaml.safeDump(vcInfo), (err) => { if (err) throw err });
}

// Determine which queue this processor count should be in.
// Queue information should be an object of type { queue0: a, queue1: b} where
// a and b are integers that represent the upper bound for that queue range
function determineQueue(queueInfo, p) {
  if (!queueInfo) return ''
  log.debug("Read queue info: ", queueInfo)

  let intervals = _.pairs(queueInfo)
  intervals.sort((x, y) => { return x[1] - y[1] })
  const queueIndex = _.sortedIndex(_.map(intervals, x => { return x[1]}), p)

  if (queueIndex < 0 || queueIndex >= intervals.length) {
    log.error(`Queue information ill-specified for processor count of ${p}.`)
    process.exit(1)
  }

  return intervals[queueIndex][0]
}

function createJobFiles(template, exp) {
  const walltime = exp.wall || '00:30:00'
  const name = exp.name || 'job'
  const optargs = exp.optargs || []
  const optargsKeys = Object.keys(optargs)
  const epoch = moment().format('YYYYMMDD-HHmmss')
  const cwd = process.cwd();

  createDirectories(epoch);

  // get all combination of args
  let optargsValues = optargsKeys.map(k => { return optargs[k] })
  optargsValues.push(exp.p)
  let options = cartesianProductOf(optargsValues)

  // For a certain combination of args
  options.map(opt => {
    const p = opt[opt.length-1]

    // Pull in enviroment variables from config
    let exports = '';
    for (var key in exp.env) {
      exports += `export ${key}=${exp.env[key]}\n`
    }

    // Parse optional args and create exports for them
    let i = 0;
    for (var key in optargs) {
      exports += `${key}=${opt[i]}\n`
      i++;
    }

    // Do weak argument evaluation
    let weakargs = []
    for (var weakarg in exp.weakargs) {
      weakargs.push(eval(exp.weakargs[weakarg]))
    }

    // Export weak args
    i = 0;
    for (var weakarg in exp.weakargs) {
      exports += `${weakarg}=${weakargs[i]}\n`
      i++;
    }

    // queue information
    const q = determineQueue(exp.q, p)

    // job name
    let jobNameArgs = [name]
    Array.prototype.push.apply(jobNameArgs, opt)
    Array.prototype.push.apply(jobNameArgs, weakargs)
    const jobName = jobNameArgs.join('-')

    // Command that will be run by the job. Start off by exporting experimental args.
    let cmd = exports
    cmd += `\ncd ${cwd}\n`

    // get commands
    _.mapObject(exp.cmds, (cmdString, cmdName) => {
      let resultFile = `experiments/results/${epoch}/${cmdName}-${opt.join('-')}`
      cmd += `\n$MPIRUN ${cmdString} &> ${resultFile}`
    });

    // Generate job file
    const generatedJob = template(jobName, p, walltime, epoch, cmd, q, cwd)

    // Write job file
    const filename = `experiments/jobs/${epoch}/${jobName}.job`
    fs.writeFile(filename, generatedJob, (err) => { if (err) throw err });
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
