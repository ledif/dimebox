'use strict'

const fs = require('fs'),
      epochUtils = require('./util/epochs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      escapes = require('ansi-escapes'),
      log = require('loglevel')

// Given a result cmdID, determine the params that are used
// For example, foo-4-32-1 may return {p: 32, depth: 1, k: 4}
function paramsForResult(epoch, result) {
  const mdFile = `${process.cwd()}/experiments/results/${epoch}/.md/${result}.yml`

  let yml = {}
  try {
     yml = yaml.safeLoad(fs.readFileSync(mdFile))
  } catch (e) { console.log(e); return {} }

  let params = {
    cmd: yml.cmd,
    p: yml.p,
    depth: yml.depth
  }

  for (let x in yml.params) {
    params[x] = yml.params[x]
  }

  return params;
}

// Get all of the results for an epoch
function combinedResults(epoch) {
  // Get all of the results for this epoch
  const stat = epochUtils.status(epoch)

  // A job is started if there's a file for it, but it's not done or failed
  const started = _.reject(stat.results, f => {
    return _.contains(stat.done, f) || _.contains(stat.failed, f)
  })

  // Waiting jobs are those that are not in any other category
  const waiting = _.reject(stat.expected, f => {
    return _.contains(stat.done, f) || _.contains(stat.failed, f) || _.contains(started, f)
  })


  let all = []

  stat.failed.map(r => { all.push({params: paramsForResult(epoch, r), state:"failed"}) })
  stat.done.map(r => { all.push({params: paramsForResult(epoch, r), state:"done"}) })
  started.map(r => { all.push({params: paramsForResult(epoch, r), state:"started"}) })
  waiting.map(r => { all.push({params: paramsForResult(epoch, r), state:"waiting"}) })

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

// Determine the symbol that should be displayed for a result
function charForState(state) {
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
    log.info(charForState(x.state), x.params)
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
