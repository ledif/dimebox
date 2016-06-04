'use strict'

let _   = require('underscore'),
    log = require('loglevel'),
    fse = require('node-fs-extra')

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

// Create the directory for a given job's workspace and make the appropriate links
// Returns absolute path to the newly created workspace directory
function setupWorkspace(exp, epoch, jobName) {
  const workspaceDir = `${process.cwd()}/experiments/workspaces/${epoch}/${jobName}`;

  fse.mkdirpSync(workspaceDir)

  // Create links specified in expfile
  exp.workspace.links.map(link => {
    const origPath = `${process.cwd()}/${link}`

    // If creating a link to a non-existent file
    if (!fse.existsSync(origPath)) {
      log.error(`Error: creating a link in a workspace for a non-existent file ${link}.`)
      process.exit(1)
    }
      
    fse.symlinkSync(origPath, `${workspaceDir}/${link}`)
  })
 
  // Create link back to experiments dir
  fse.symlinkSync(`${process.cwd()}/experiments`, `${workspaceDir}/experiments`)

  return workspaceDir;
}


// Create the portion of the Bash script that executes a given command
//   for example: mpirun -np 4 ./exe args >> out
// 
// Also creates code so that a file named .$cmdID.fail will be
// created if this command fails
//
// @param epoch The epoch for this experiment
// @param cmdID The unique ID for the command (e.g., heat-256-32-1)
// @param cmdString The command to execute (e.g., ./heat 256)
// @return A string representing bash code
function execCmd(epoch, cmdID, cmdString) {
  const resultFile = `experiments/results/${epoch}/${cmdID}`
  return `
    $MPIRUN ${cmdString} >> ${resultFile} 2>&1
    s=\${PIPESTATUS[0]}
    if [ $s -ne 0 ]; then
      touch experiments/results/${epoch}/.${cmdID}.fail
    fi
   `
}

function generateJob(template, exp, epoch, opt) {
  const optargs = exp.optargs || []
  const p = opt[opt.length-2]
  const depth = opt[opt.length-1]
  const cwd = process.cwd();

  const width = p*depth;

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

  // Set up depth var
  const depthvar = exp.depthvar
  exports += `export ${depthvar}=${depth}`

  // queue information
  const q = determineQueue(exp.q, p)

  // job name
  let jobNameArgs = [exp.name]
  Array.prototype.push.apply(jobNameArgs, opt)
  Array.prototype.push.apply(jobNameArgs, weakargs)
  const jobName = jobNameArgs.join('-')

  // Create workspace directories if necessary
  let workspace = cwd;
  if (exp.workspace) {
    workspace = setupWorkspace(exp, epoch, jobName)
  }

  // Command that will be run by the job.
  let cmd = exports

  // Change directory to cwd or an isolated workspace if specified
  cmd += `\ncd ${workspace}\n`

  // Set up trial loop
  const numTrials = exp.trials || 1
  cmd += `\nfor DIMEBOX_TRIAL_ID in \`seq 0 ${numTrials-1}\`\ndo`

  // For each command in experiment
  _.mapObject(exp.cmds, (cmdString, cmdName) => {
    // The ID of a command is the unique string to identify it (e.g., foo-100-32-1)
    const cmdID = `${cmdName}-${opt.join('-')}`;
    cmd += execCmd(epoch, cmdID, cmdString)
  });
 
  // End trial loop
  cmd += '\ndone\n'

  // If there is an epilogue, add it to command
  if (exp.epilogue) {
    cmd += `\n${exp.epilogue}`
  }
  
  // Generate job file
  const generatedJob = template({
    name: jobName,
    width: width,
    p: p,
    depth: depth,
    wall: exp.wall,
    epoch: epoch, 
    cmd: cmd,
    q: q,
    cwd: cwd
  })

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
  optargsValues.push(exp.depth)
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
