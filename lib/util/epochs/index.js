"use strict"

const fs      = require('fs'),
      path    = require('path'),
       _      = require('lodash'),
      log     = require('loglevel'),
      yaml    = require('js-yaml'),
      moment  = require('moment-twitter'),
      resolve = require('./resolve'),
      dirs    = require('../dirs')

// Grab the files in directory or return an empty list
// List is of objects {name, modified}
function filesInDirectory(dir)
{
  let files = []
  try {
    files = fs.readdirSync(dir)
  } catch (e) {
    log.debug(e)
  }

  return _.map(files, f => {
    const stat = fs.statSync(path.join(dir, f))
    return { name: f, modified: moment(stat.mtime) }
  });
}

module.exports = {
  // Resolve a symbolic epoch (e.g., HEAD) to a concrete epoch
  // If it cannot be resolved, the program exits.
  resolve: function(epoch) {
    const epochs = fs.readdirSync(dirs.jobs()).sort().reverse()
    
    let resolved = null
    
    try {
      resolved = resolve(String(epoch), epochs)
    } catch(e) {
      log.error("Error:", e.message)
      process.exit(1)
    }

    // Make sure it's actually an epoch now
    if (resolved[0] != '2') {
      log.error(`Error: ${epoch} is not a valid name for an epoch.`)
      process.exit(1)
    }

    // Check if it resolved to something that exists
    if (!fs.existsSync(dirs.jobs(resolved))) {
      log.error(`Error: epoch ${resolved} does not exist.`)
      process.exit(1)
    }

    return resolved
  },

  // Determine the results status of an epoch in terms of the number
  // of expected results, completed results and failed results.
  status: function(epoch) {
    const resultsDir = dirs.results(epoch)
    const runFile = dirs.jobs(epoch, 'run.yml')

    let desc = '-'
    let wall = moment.duration({years: 1})
    // read experiment YAML for description
    try {
        var exp = yaml.safeLoad(fs.readFileSync(runFile))
        desc = exp.desc
        wall = moment.duration({ seconds: exp.wall })
    } catch (e) { }

    const failDir = dirs.results(epoch, '.fail')
    const doneDir = dirs.results(epoch, '.done')
    const mdDir = dirs.results(epoch, '.md')
    const startedDir = dirs.results(epoch, '.started')

    // Results that have finished succesfully
    const done = filesInDirectory(doneDir);

    // Results that finished with an error code
    let failed = filesInDirectory(failDir)
  
    // Total expected results
    const expected = _.map(filesInDirectory(mdDir), x => {
      return {
        name: x.name.substr(0, x.name.length-4),
        modified: x.modified 
      }
    })

    // Results that currently exist
    const results = fs.existsSync(startedDir) ? 
      filesInDirectory(startedDir) :  // Use the startedDir for determining which jobs started.
      _.reject(                       // If startedDir is not there, just see which files have been
        filesInDirectory(resultsDir), // written to already
        x => x.name.startsWith(".") || x.name == "stderr" || x.name == "stdout"
      )

    // Results that started but timed out
    const timedOut = _.filter(results, res => {
      const hitWall = moment(res.modified).add(wall).isBefore(moment())
      const notFinished = !_.find(done, x => res.name == x.name)
        && !_.find(failed, x => res.name == x.name)

      return hitWall && notFinished
    })

    // Add timed out results to failed results
    failed = _.concat(failed, timedOut)

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
    const runFile = dirs.jobs(epoch, 'run.yml')
    try {
        return yaml.safeLoad(fs.readFileSync(runFile))
    } catch (e) {
      return {}
    }
  }
}
