"use strict"

const fs   =  require('fs'),
       _   = require('underscore'),
      log  = require('loglevel'),
      yaml = require('js-yaml')

// Grab the files in directory or return an empty list
function filesInDirectory(dir)
{
  let files = []
  try {
    files = fs.readdirSync(dir)
  } catch (e) {
    log.debug(e)
  }
  return files;
}

module.exports = {
  // Resolve a symbolic epoch (e.g., HEAD) to a concrete epoch
  // If it cannot be resolved, the program exits.
  resolve: function(epoch) {
    // find the most recent epoch
    if (epoch == 'HEAD') {
      let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
      if (epochs.length == 0) {
        log.error("Error: HEAD specified but experiment set is empty.")
        process.exit(1)
      }

      log.debug("Resolved epoch to ", epochs[0])
      return epochs[0]
    }

    // Make sure it's actually an epoch now
    if (epoch[0] != '2') {
      log.error(`Error: ${epoch} is not a valid name for an epoch.`)
      process.exit(1)
    }

    // specifc epoch requested, check if it exists and return
    if (!fs.existsSync(`${process.cwd()}/experiments/jobs/${epoch}`)) {
      log.error(`Error: epoch ${epoch} does not exist.`)
      process.exit(1)
    }

    return epoch
  },

  // Determine the results status of an epoch in terms of the number
  // of expected results, completed results and failed results.
  status: function(epoch) {
    const resultsDir = `${process.cwd()}/experiments/results/${epoch}`
    const runFile = `${process.cwd()}/experiments/jobs/${epoch}/run.yml`

    let desc = '-'
    // read experiment YAML for description
    try {
        var exp = yaml.safeLoad(fs.readFileSync(runFile))
        desc = exp.desc
    } catch (e) { }

    const failDir = resultsDir + '/.fail'
    const doneDir = resultsDir + '/.done'
    const mdDir = resultsDir + '/.md'
    const done = filesInDirectory(doneDir);
    const failed = filesInDirectory(failDir)
    const expected = _.map(filesInDirectory(mdDir), s => s.substr(0, s.length-4))

    const results = _.reject(
      filesInDirectory(resultsDir),
      f => f.startsWith(".") || f == "stderr" || f == "stdout"
    )

    return {
      epoch: epoch,
      expected: expected,
      done: done,
      failed: failed,
      results: results,
      desc: desc
    }
  },

  // Fetch the expfile for a given epoch
  // Assumes the epoch is already resolved
  exp: function(epoch) {
    const runFile = `${process.cwd()}/experiments/jobs/${epoch}/run.yml`
    try {
        return yaml.safeLoad(fs.readFileSync(runFile))
    } catch (e) {
      return {}
    }
  }
}
