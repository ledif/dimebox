'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      log = require('loglevel'),
      parseFile = require('./parse-file')

const warn = chalk.red.bold("WARNING:")

// Parse the result set for a given epoch with a parser
module.exports = function (opt) {
  //const { epoch, tag, parser, shouldAggregate } = opt
  const epoch = opt.epoch
  const tag = opt.tag
  const parser = opt.parser
  const shouldAggregate = opt.shouldAggregate

  const resultsDir = `${process.cwd()}/experiments/results/${epoch}/`

  try {
    var resultFiles = _.reject(
      fs.readdirSync(resultsDir),
      filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout' || filename.startsWith("."); }
    )
  } catch (e) {
    log.error("Error: failed to open results directory.", e.message)
  }

  const parsedResults = _.map(resultFiles, file => {
    return parseFile({
      file: resultsDir + file,
      tag: tag,
      parser: parser,
      result: file,
      epoch: epoch,
      shouldAggregate: shouldAggregate
     })
  })

  // Print information about failed files
  const failedFiles = _.filter(parsedResults, result => { return result.kvs.length == 0 })
  if (failedFiles.length > 0) {
    log.warn(warn, failedFiles.length, "files failed to parse: ")
    failedFiles.map(f => { log.warn(f.file) })
  }

  // Get non empty rows and abort if all rows are empty
  const nonEmptyResults = _.filter(parsedResults, result => { return result.kvs.length > 0 })
  if (nonEmptyResults.length == 0)
    return

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
        log.warn(warn, `Key '${key}' missing from file:`)
        log.warn(result.file)
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
    rows: orderedRows
  }
}
