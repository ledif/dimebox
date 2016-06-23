'use strict'

const fs = require('fs'),
      epochUtils = require('./util/epochs'),
      _ = require('lodash'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      escapes = require('ansi-escapes'),
      log = require('loglevel'),
      moment = require('moment.twitter'),
      params = require('./util/results').params,
      dirs = require('./util/dirs')

// Insert all of the results from the input array to the output array
// and add information about state and parameters.
function contributeAll(output, input, epoch, state) {
  input.map(r => {
    output.push({
      state: state,
      modified: r.modified,
      params: _.fromPairs(params(epoch, r.name))
    }) 
  })
}

// Get all of the results for an epoch
function combinedResults(epoch) {
  // Get all of the results for this epoch
  const stat = epochUtils.status(epoch)

  // A job is started if there's a file for it, but it's not done or failed
  const started = _.reject(stat.results, f => {
    return _.some(stat.done, x => f.name == x.name)
      || _.some(stat.failed, x => f.name == x.name)
  })

  // Waiting jobs are those that are not in any other category
  const waiting = _.reject(stat.expected, f => {
    return _.some(stat.done, x => f.name == x.name)
      || _.some(stat.failed, x => f.name == x.name)
      || _.some(started, x => f.name == x.name)
  })


  let all = []

  contributeAll(all, stat.failed, epoch, "failed")
  contributeAll(all, stat.done, epoch, "done")
  contributeAll(all, started, epoch, "started")
  contributeAll(all, waiting, epoch, "waiting")

  all = _.sortBy(all, function(x) {
    return x.params['p']
  })

  return {
    results: all,
    counts: {
      failed: stat.failed.length,
      done: stat.done.length,
      started: started.length,
      waiting: waiting.length,
    }
  }
}


// Print the status of a single result
function printResult(result) {

// Determine the symbol that should be displayed for a result
  const charSelector = function(state) {
    switch (state) {
      case "failed": return chalk.red('x')
      case "done": return chalk.green('+')
      case "started": return chalk.yellow('o')
      case "waiting": return chalk.gray('-')
      default:
        log.error("Unknown state", state)
        process.exit(1)
    }
  }

  const t = result.state != "waiting" ? moment(result.modified).twitter() : "- "

  log.info(charSelector(result.state), t, JSON.stringify(result.params))
}

// For each result, print its status
// Return how many results were printed
function currentStatus(epoch) {
  const combined = combinedResults(epoch)

  const done = chalk.green(combined.counts.done)
  const failed = chalk.red(combined.counts.failed)
  const started = chalk.yellow(combined.counts.started)
  const waiting = chalk.gray(combined.counts.waiting)

  log.info(`${epoch} (${done}/${failed}/${started}/${waiting})`)

  combined.results.map(x => {
    printResult(x)
  });

  const isDone = combined.counts.done + combined.counts.failed >= combined.results.length
  if (isDone)
    process.exit(0)

  return combined.results.length
}

module.exports = function(epoch, interval) {
  // Resolve symbolic epoch
  epoch = epochUtils.resolve(epoch)

  // Get the experiment params
  const exp = epochUtils.exp(epoch)

  // Print header and first set of results
  log.info(`${exp.name}: ${exp.desc}`)
  const numResults = currentStatus(epoch)

  // Loop forever, printing results
  setInterval(() => {
    log.info(`${exp.name}: ${exp.desc}`)
    log.info(escapes.eraseLines(numResults+3))
    log.info(escapes.cursorUp(2))
    currentStatus(epoch)
  }, interval)

}
