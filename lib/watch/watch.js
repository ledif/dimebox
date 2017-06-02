'use strict'

const fs = require('fs'),
      epochUtils = require('../util/epochs'),
      _ = require('lodash'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      escapes = require('ansi-escapes'),
      log = require('loglevel'),
      moment = require('moment-twitter'),
      Table = require('cli-table'),
      params = require('../util/results').params,
      dirs = require('../util/dirs')

// Insert all of the results from the input array to the output array
// and add information about state and parameters.
function contributeAll(output, input, epoch, state) {
  input.forEach(r => {
    output.push({
      state: state,
      modified: r.modified,
      name: r.name,
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


// Compute the row for a given result
function row(result) {
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

  const t = result.state != "waiting" ? moment(result.modified).twitter() : "-"

  return _.concat([], charSelector(result.state), t, _.values(result.params))
}

/** Get the current status of the experiment */
function currentStatus(epoch, exp) {
  // Get current status of all results
  const combined = combinedResults(epoch)

  // Colorize counts of each category
  const done = combined.counts.done
  const failed = combined.counts.failed
  const started = combined.counts.started
  const waiting = combined.counts.waiting

  // Format each row
  const rows = _.map(combined.results, row)

  // Get the header from the keys
  const header = _.concat([], '', '', _.keys(combined.results[0].params))

  const expinfo = {
    name: exp.name, desc:exp.desc,
    epoch, done, failed, started, waiting
  }

  const results = {
    rows, header
  }

  return {expinfo, results, activities: combined.results, combined: combined.results}
}

module.exports = {
  currentStatus: currentStatus
}
