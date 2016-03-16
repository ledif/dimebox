'use strict'

let _   = require('underscore'),
    log = require('loglevel')

// Cartesian product of lists.
// xs is a list of lists
function cartesianProductOf(xs) {
    return _.reduce(xs, function(a, b) {
        return _.flatten(_.map(a, function(x) {
            return _.map(b, function(y) {
                return x.concat([y]);
            });
        }), true);
    }, [ [] ]);
};

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

function generateJob(template, exp, epoch, opt) {
  const optargs = exp.optargs || []
  const p = opt[opt.length-1]
  const cwd = process.cwd();

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
  let jobNameArgs = [exp.name]
  Array.prototype.push.apply(jobNameArgs, opt)
  Array.prototype.push.apply(jobNameArgs, weakargs)
  const jobName = jobNameArgs.join('-')

  // Command that will be run by the job.
  let cmd = exports
  cmd += `\ncd ${cwd}\n`

  // For each command in experiment
  _.mapObject(exp.cmds, (cmdString, cmdName) => {
    let resultFile = `experiments/results/${epoch}/${cmdName}-${opt.join('-')}`
    cmd += `\n$MPIRUN ${cmdString} &> ${resultFile}`
  });

  // If there is an epilogue, add it to command
  if (exp.epilogue) {
    cmd += `\n${exp.epilogue}`
  }
  
  // Generate job file
  const generatedJob = template(jobName, p, exp.wall, epoch, cmd, q, cwd)
  const filename = `experiments/jobs/${epoch}/${jobName}.job`

  return {
    filename: filename,
    contents: generatedJob
  }
}

function generateJobs(template, exp, epoch) {
  const optargs = exp.optargs || []
  const optargsKeys = Object.keys(optargs)

  // Get all combination of args
  let optargsValues = optargsKeys.map(k => { return optargs[k] })
  optargsValues.push(exp.p)
  let options = cartesianProductOf(optargsValues)

  // For each combination of p and optargs
  return _.map(options, opt => {
    return generateJob(template, exp, epoch, opt)
  });
}

module.exports = {
  generateJobs: generateJobs,
  generateJob: generateJob
}
