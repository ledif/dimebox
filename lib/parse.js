'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      epochUtils = require('./util/epochs'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      log = require('loglevel'),
      check = require('check-types')

const warn = chalk.red.bold("WARNING:")

// Parse a file and return an array of [key, value] entries for the given tag
function parseFile(file, tag, parser) {
  // Read file
  try {
    var contents = fs.readFileSync(file)
  } catch(e) {
    log.debug(warn, `Failed to read ${file}`)
    log.debug(e.message)
    return {
      file: file,
      kvs: []
    }
  }

  let kvs = []
  // Feed each line to parser
  contents.toString().split('\n').map(line => {
    // Call parser to receive array of [key, value]
    try {
      var parsedLine = parser(line)
    } catch (e) {
      log.warn(warn, `Parser threw while parsing line '${line}' from file ${file}:`)
      log.warn(e.message)
    }

    // If the parser found something useful and it is either the same tag or doesn't have a tag
    if (parsedLine && (!parsedLine.tag || parsedLine.tag == tag)) {
      kvs.push([parsedLine.key, parsedLine.value])
     }
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

  // Print header and rows
  log.info(Array.from(keys).join('\t'))
  orderedRows.map(row => {
    log.info(row.join('\t'))
  })
}


function loadParser(parser) {
  const userHome = process.env.HOME || '~'
  const userDimeboxParserDir = userHome + '/.dimebox/parsers/'

  if (fs.existsSync(userDimeboxParserDir + '/' + parser + '.js'))
    return require(userDimeboxParserDir + '/' + parser);

  const parserInDimeboxDir = __dirname + '/parsers/' + parser + '.js';
  
  if (!fs.existsSync(parserInDimeboxDir)) {
    log.error('Cannot find parser', parser, 'in dimebox distribution or', userDimeboxParserDir)
    process.exit(1);
  }

  try {
    return require('./parsers/' + parser);
  } catch (e) {
    log.error('Cannot load parser file in dimebox/lib/parsers/' + parser, e)
    process.exit(1);
  }
}

module.exports = function(epoch, tag, parser) {
  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = loadParser(parser)

  parseResults(epoch, tag, parserFn)
}
