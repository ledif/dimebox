'use strict'

const fs = require('fs'),
      epochUtils = require('../util/epochs'),
      chalk = require('chalk'),
      log = require('loglevel'),
      config = require('../config.js'),
      dump = require('./dump'),
      parseEpoch = require('./parse-epoch')

const warn = chalk.red.bold("WARNING:")


module.exports = function(epoch, tag, parser, agg, sortBy) {
  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = config.parser(parser)

  const columns = sortBy.split(/\s*,\s*/)
  const orders  = columns.map(n => { return n.match(/^~/) ? 'desc' : 'asc' })

  // Parse the results into a structured header / rows
  const results = parseEpoch({
    epoch: epoch,
    tag: tag,
    parser: parserFn,
    shouldAggregate: agg,
    sortColumns: columns.map(e => { return "_" + e.replace(/^~/,'') }),
    orders: orders,
  })

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
