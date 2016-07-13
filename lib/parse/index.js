'use strict'

const fs = require('fs'),
      epochUtils = require('../util/epochs'),
      chalk = require('chalk'),
      log = require('loglevel'),
      config = require('../config.js'),
      dump = require('./dump'),
      parseEpoch = require('./parse-epoch'),
      manipulate = require('./manipulate')

const warn = chalk.red.bold("WARNING:")


module.exports = function(opt) {
  let epoch = opt.epoch
  let parser = opt.parser
  let sortBy = opt.sortBy || ""
  let select = opt.select
  let filter = opt.filter

  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = config.parser(parser)


  // Parse the results into a structured header / rows
  let results = parseEpoch({
    epoch: epoch,
    tag: opt.tag,
    parser: parserFn,
    shouldAggregate: opt.agg,
  })

  // Apply manipulates to the tidied data
  try {
    results = manipulate(results, {order: sortBy, select: select, filter: filter})
  } catch(e) {
    console.log(chalk.red.bold("ERROR:"), e.message)
    process.exit(1)
  }

  // Dump parsed results to file
  dump({
    epoch,
    parserName: parser,
    parser: parserFn.toString(),
    parsed: results
  })

  // Print header and rows
  if(results) {
    log.info(results.header.join('\t'))
    results.rows.map(row => {
      log.info(row.join('\t'))
    })
  } else {
    log.error("Error: no results to parse");
  }
}
