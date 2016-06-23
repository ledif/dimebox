'use strict'

const fs = require('fs'),
      epochUtils = require('./util/epochs'),
      _ = require('lodash'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      escapes = require('ansi-escapes'),
      log = require('loglevel'),
      moment = require('moment-twitter'),
      Table = require('cli-table'),
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

// Print a table of the all of the results and their status
// Return how many results were printed
function currentStatus(epoch, exp) {
  // Get current status of all results
  const combined = combinedResults(epoch)

  // Colorize counts of each category
  const done = chalk.green(combined.counts.done)
  const failed = chalk.red(combined.counts.failed)
  const started = chalk.yellow(combined.counts.started)
  const waiting = chalk.gray(combined.counts.waiting)

  // Print header
  log.info(`${exp.name}: ${exp.desc}`)
  log.info(`${epoch} (${done}/${failed}/${started}/${waiting})`)

  // Format each row
  const rows = _.map(combined.results, row)

  // Get the header from the keys
  const header = _.concat([], '', '', _.keys(combined.results[0].params))

  // Get the widths for the columns
  const widths = _.chain(_.concat(rows, [header])) // Combine rows with header
    .unzip() // Get columns
    .drop(1) // Drop the state column
    .map(col => { // Map each column to its max length as string
      const longest = _.maxBy(col, field => String(field).length)
      return String(longest).length
    })
    .map(length => length+2) // Add some room for padding
    .value()

  let table = new Table({
    head: header,
    colWidths: _.concat([3], widths),
    colAligns: _.fill(Array(header.length), 'middle'),
    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
           , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
           , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
           , 'right': '' , 'right-mid': '' , 'middle': ' ' },
    style: { 'padding-left': 1, 'padding-right': 1, head: ['grey'] }
   });


  // Populate and print table
  Array.prototype.push.apply(table, rows)
  log.info(table.toString());

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

  // Print first set of results
  const numResults = currentStatus(epoch, exp)

  // Loop forever, printing results
  setInterval(() => {
    log.info(escapes.eraseLines(numResults+4))
    log.info(escapes.cursorUp(2))
    currentStatus(epoch, exp)
  }, interval)

}
