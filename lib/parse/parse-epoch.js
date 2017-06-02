'use strict'

const fs = require('fs'),
      _ = require('lodash'),
      chalk = require('chalk'),
      log = require('loglevel'),
      dirs = require('../util/dirs'),
      parseFile = require('./parse-file')

const warn = chalk.red.bold("WARNING:")

// Convert input to a number if possible
function asNumber(str) {
  return isNaN(str) ? str : Number(str)
}

// Parse the result set for a given epoch with a parser
module.exports = function (opt) {
  //const { epoch, tag, parser, shouldAggregate } = opt
  const epoch = opt.epoch
  const tag = opt.tag
  const parser = opt.parser
  const params = opt.params
  const shouldAggregate = opt.shouldAggregate
  const parserIsObject = !(parser instanceof Function)
  const parserFn = parserIsObject ? parser.parseLine : parser

  const resultsDir = dirs.results(epoch)

  try {
    var resultFiles = _.reject(
      fs.readdirSync(resultsDir),
      filename => filename.includes('.yml') || filename === 'stderr' || filename === 'stdout' || filename.startsWith(".")
    )
  } catch (e) {
    log.error("Error: failed to open results directory.", e.message)
    process.exit(1)
  }

  if(parserIsObject && parser.onInit instanceof Function)
    parser.onInit(params)

  const parsedResults = _(resultFiles)
    .map(file => {
      if(parserIsObject && parserIsObject.onNewFile instanceof Function)
        parser.onNewFile(file)

      return parseFile({
        file: dirs.results(epoch, file),
        tag: tag,
        parser: parserFn,
        result: file,
        epoch: epoch,
        shouldAggregate: shouldAggregate
       })
    })
    .value()

  // Find out which files failed to parse
  let failed = _.chain(parsedResults)
    .map(result => {
    // If this file parsed fine
    if (result.observations.length > 0 && result.failures.length == 0)
      return null

    let fails = result.failures
    if (result.observations.length == 0)
      fails.push("Result has no information.")

    return {file: result.file, status: fails}
  })
  .filter()
  .value()

  // Print information about failed files
  const emptyResults = _.filter(parsedResults, result => result.observations.length == 0)
  if (emptyResults.length > 0) {
    emptyResults.forEach(f => {
      log.warn(warn, "Result has no information:", f.file)
    })
  }

  // Get non empty rows and abort if all rows are empty
  const nonEmptyResults = _.filter(parsedResults, result => result.observations.length > 0)
  if (nonEmptyResults.length == 0)
    return {
      header: [], rows: [], failed: failed
    }

  // Make a row for each observation
  const observationsAsRows = _(nonEmptyResults)
    .map(result => {
      return _.map(result.observations, obs => {
        return {kvs: obs, file: result.file}
      })
    })
    .flatten()
    .value()

  // Turn each row into a map
  const rowsAsMaps = _.chain(observationsAsRows).map(result => {
    let row = result.kvs
    let m = new Map()
    row.forEach(kv => {
      if (m.has(kv[0])) {
        log.warn(warn, `file contains same key '${kv[0]}' twice:`)
        log.warn(result.file)
      } else {
        m.set(kv[0], asNumber(kv[1]))
      }
    })
    return {
      file: result.file,
      map: m
    }
  }).value()


  // Canonical header is the set of keys from the row with the most keys
  const keys = Array.from(
    _.maxBy(rowsAsMaps, row => row.map.size).map.keys()
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
        //fails.push({file: result.file, status: errorString})
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
