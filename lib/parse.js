'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      epochUtils = require('./util/epochs'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      log = require('loglevel')


// Parse a file and return an array of [key, value] entries for the given tag
function parseFile(file, tag, parser) {
  // Read file
  try {
    var contents = fs.readFileSync(file)
  } catch(e) {
    log.debug("Failed to read", file)
    return {
      file: file,
      kvs: []
    }
  }

  let kvs = []
  contents.toString().split('\n').map(line => {
    const parsedLine = parser(line)

    if (parsedLine && parsedLine.tag == tag)
      kvs.push([parsedLine.key.trim(), parsedLine.value.trim()])
  })

  return {
    file: file,
    kvs: kvs
  }
}

// Parse the result set for a given epoch with a parser
function parseResults(epoch, tag, parser) {
  const resultsDir = `${process.cwd()}/experiments/results/${epoch}/`

  try {
    var resultFiles = _.reject(
      fs.readdirSync(resultsDir),
      filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout'; }
    )
  } catch (e) {
    log.error("Error: failed to open results directory.", e.message)
  }

  const parsedResults = _.map(resultFiles, file => {
    return parseFile(resultsDir + file, tag, parser)
  })

  // Print information about failed files
  const failedFiles = _.filter(parsedResults, result => { return result.kvs.length == 0 })
  if (failedFiles.length > 0) {
    log.warn(chalk.red.bold("WARNING:"), failedFiles.length, "files failed to parse: ")
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
        log.warn(chalk.red("WARNING:"), `file contains same key '${kv[0]}' twice:`)
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

  // Canonical header is the set of keys from the first row
  const keys = Array.from(rowsAsMaps[0].map.keys())

  // Get the values for all rows in the same order as the header
  const orderedRows = _.map(rowsAsMaps, result => {
    let map = result.map
    let row = []
    for (const key of keys) {
      if (map.has(key)) {
        row.push(map.get(key))
      } else {
        log.warn(chalk.red("WARNING:"), `Key '${key}' missing from file:`)
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

  // Print header and rows
  log.info(Array.from(keys).join('\t'))
  orderedRows.map(row => {
    log.info(row.join('\t'))
  })
}


module.exports = function(epoch, tag, parser) {
  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = require('./parsers/default-key-value');

  parseResults(epoch, tag, parserFn)
}
