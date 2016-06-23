'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      log = require('loglevel'),
      dirs = require('../util/dirs'),
      parseFile = require('./parse-file')

const warn = chalk.red.bold("WARNING:")

// Parse the result set for a given epoch with a parser
module.exports = function (opt) {
  //const { epoch, tag, parser, shouldAggregate } = opt
  const epoch = opt.epoch
  const tag = opt.tag
  const parser = opt.parser
  const shouldAggregate = opt.shouldAggregate

  const resultsDir = dirs.results(epoch)

  try {
    var resultFiles = _.reject(
      fs.readdirSync(resultsDir),
      filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout' || filename.startsWith("."); }
    )
  } catch (e) {
    log.error("Error: failed to open results directory.", e.message)
    process.exit(1)
  }

  const parsedResults = _.map(resultFiles, file => {
    return parseFile({
      file: dirs.results(epoch, file),
      tag: tag,
      parser: parser,
      result: file,
      epoch: epoch,
      shouldAggregate: shouldAggregate
     })
  })

  // Find out which files failed to parse
  let failed = _.chain(parsedResults)
    .map(result => {
    // If this file parsed fine
    if (result.kvs.length > 0 && result.failures.length == 0)
      return null

    let fails = result.failures
    if (result.kvs.length == 0)
      fails.push("Result has no information.")

    return {file: result.file, status: fails}
  })
  .filter()
  .value()

  // Print information about failed files
  const emptyResults = _.filter(parsedResults, result => { return result.kvs.length == 0 })
  if (emptyResults.length > 0) {
    emptyResults.map(f => {
      log.warn(warn, "Result has no information:", f.file)
    })
  }

  // Get non empty rows and abort if all rows are empty
  const nonEmptyResults = _.filter(parsedResults, result => { return result.kvs.length > 0 })
  if (nonEmptyResults.length == 0)
    return {
      header: [], rows: [], failed: failed
    }

  // Turn each row into a map
  const rowsAsMaps = _.map(nonEmptyResults, result => {
    let row = result.kvs
    let m = new Map()
    row.map(kv => {
      if (m.has(kv[0])) {
        log.warn(warn, `file contains same key '${kv[0]}' twice:`)
        log.warn(result.file)
      } else {
        m.set(kv[0], kv[1])
      }
    })
    return {
      file: result.file,
      map: m
    }
  })


  // Canonical header is the set of keys from the row with the most keys
  const keys = Array.from(
    _.max(rowsAsMaps, row => row.map.size).map.keys()
  )

  // Get the values for all rows in the same order as the header
  const orderedRows = _.map(rowsAsMaps, result => {
    let map = result.map
    let row = []
    for (const key of keys) {
      if (map.has(key)) {
        row.push(map.get(key))
      } else {
        const errorString = `Key '${key}' missing from file:`
        log.warn(warn, errorString, result.file)
        log.warn(result.file)
        fails.push({file: result.file, status: errorString})
        row.push("null")
      }
    }

    // Check to make sure this row makes sense in terms of its keys
    if (map.size > keys.length) {
      log.warn(chalk.red("WARNING:"), "file has", map.size, "key-value pairs while header has", keys.length, "keys:")
      log.warn(result.file)
    }

    return row
  })

  return {
    header: Array.from(keys),
    rows: orderedRows,
    failed: failed
  }
}
