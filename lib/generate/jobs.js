'use strict'

let _   = require('lodash'),
    log = require('loglevel'),
    fse = require('node-fs-extra'),
    dirs = require('../util/dirs'),
    yaml    = require('js-yaml')

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

  let intervals = _.toPairs(queueInfo)
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
  const workspaceDir = dirs.workspaces(epoch, jobName);

  fse.mkdirpSync(workspaceDir)

  // Create links specified in expfile
  exp.workspace.links.map(link => {
    const origPath = dirs.build(link)

    // If creating a link to a non-existent file
    if (!fse.existsSync(origPath)) {
      log.error(`Error: creating a link in a workspace for a non-existent file ${link}.`)
      process.exit(1)
    }
      
    fse.symlinkSync(origPath, `${workspaceDir}/${link}`)
  })
 
  // Create link back to experiments dir
  fse.symlinkSync(dirs.build("experiments"), `${workspaceDir}/experiments`)

  return workspaceDir;
}


// Write the metadata YAML file for a given result
// This file will be in the $epoch/.md directory
function writeMetadata(options) {
  let md = {

    job: dirs.jobs(options.epoch, `${options.jobName}.job`),
    cmd: options.cmdName,
    p: options.p,
    depth: options.depth,
    params: {}
  }

  let i = 0;
  for (var x in options.opt.keys) {
    md.params[x] = options.opt.values[i++]
  }

  i = 0;
  options.weakargs.keys.map(key => {
    md.params[key] = options.weakargs.values[i++]
  })

  const mdFile = dirs.results(options.epoch, `.md/${options.cmdID}.yml`)
  fse.writeFile(mdFile, yaml.safeDump(md), (err) => { if (err) throw err });
}

// Create the portion of the Bash script that executes a given command
//   for example: mpirun -np 4 ./exe args >> out
// 
// Also creates code so that a file called $cmdID will be
// created in the .fail directory if this command fails
// or in the .done directory if it exits succesfully
//
// @param epoch The epoch for this experiment
// @param cmdID The unique ID for the command (e.g., heat-256-32-1)
// @param cmdString The command to execute (e.g., ./heat 256)
// @return A string representing bash code
function execCmd(epoch, cmdID, cmdString) {
  const resultFile = dirs.results(epoch, cmdID)
  return `
    touch ${dirs.results(epoch, '.started', cmdID)}
    $MPIRUN ${cmdString} >> ${resultFile} 2>&1
    DIMEBOX_STATUS=\${PIPESTATUS[0]}
    if [ $DIMEBOX_STATUS -eq 0 ]; then
      touch ${dirs.results(epoch, '.done', cmdID)}
    else
      touch ${dirs.results(epoch, '.fail', cmdID)}
    fi
   `
}

// Compute a job name (or command ID) from the experiment name and arguments.
//
// @param name Either the experiment name (for the job's name) or
//             a command (for a command ID)
// @param opt The values for the optargs
// @param weakargs The values for the weak args
function nameOf(name, opt, weakargs) {
  let jobNameArgs = [name]
  Array.prototype.push.apply(jobNameArgs, opt)
  Array.prototype.push.apply(jobNameArgs, weakargs)

  return _.map(jobNameArgs, _.snakeCase).join('-')
}

function generateJob(template, exp, epoch, opt) {
  const optargs = exp.optargs || []
  const p = opt[opt.length-2]
  const depth = opt[opt.length-1]
  const cwd = dirs.base();

  const width = p*depth;

  // Pull in enviroment variables from config
  let exports = '';
  for (var key in exp.env) {
    exports += `export ${key}=${exp.env[key]}\n`
  }

  // Parse optional args and create exports for them
  let i = 0;
  for (var key in optargs) {
    // surround value in quotes if it contains a space
    const val = String(opt[i]).includes(" ") ? `"${opt[i]}"` : opt[i]
    exports += `${key}=${val}\n`
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
  const jobName = nameOf(exp.name, opt, weakargs)

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
  _.mapKeys(exp.cmds, (cmdString, cmdName) => {
    // The ID of a command is the unique string to identify it (e.g., foo-100-32-1)
    const cmdID = nameOf(cmdName, opt, weakargs)

    // Create script to execute commands
    cmd += execCmd(epoch, cmdID, cmdString)

    // Write metadata file
    writeMetadata({
      cmdID: cmdID,
      cmdName: cmdName,
      jobName: jobName,
      opt: { keys: optargs, values: opt},
      weakargs: { keys: _.keys(exp.weakargs), values: weakargs },
      epoch: epoch, p: p, depth: depth
    })
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

  const filename = dirs.jobs(epoch, `${jobName}.job`)

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
