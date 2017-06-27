'use strict'

const fs = require('fs'),
      _  = require('lodash'),
      epochUtils = require('../util/epochs'),
      chalk = require('chalk'),
      log = require('loglevel'),
      config = require('../config.js'),
      dump = require('./dump'),
      parseEpoch = require('./parse-epoch'),
      manipulate = require('./manipulate')

const warn = chalk.red.bold("WARNING:")

/** @brief Write the results to stdout as TSV */
function write_as_tsv(results) {
  log.info(results.header.join('\t'))

  results.rows.forEach(row => {
    log.info(row.join('\t'))
  })
}

/** @brief Write the results to stdout as JSON */
function write_as_json(df) {
  const as_objects = _.map(df.rows, row => _.zipObject(df.header, row))
  console.log(as_objects)
}

module.exports = function(opt) {
  let epoch = opt.epoch
  let parser = opt.parser
  let sortBy = opt.sortBy || ""
  let select = opt.select
  let filter = opt.filter
  let params = opt.params
  let format = opt.format

  const write_fn = {
    tsv: write_as_tsv,
    json: write_as_json
  }[format];

  // Check to see if the user-specified output format is one that we know
  if (!write_fn) {
    console.log(chalk.red.bold("ERROR:"), format, "is not a valid output format")
    process.exit(1)
  }

  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = config.parser(parser)

  // Parse the results into a structured header / rows
  let results = parseEpoch({
    epoch: epoch,
    tag: opt.tag,
    parser: parserFn,
    params: params,
    shouldAggregate: opt.agg,
  })

  // Apply manipulates to the tidied data
  try {
    results = manipulate(results, {order: sortBy, select: select, filter: filter})
  } catch(e) {
    console.log(chalk.red.bold("ERROR:"), e.message)
    process.exit(1)
  }

  const usesParams = !(parserFn instanceof Function) && (parserFn.onInit instanceof Function)

  // Dump parsed results to file
  dump({
    epoch,
    parserName: parser,
    parser: parserFn.toString(),
    parserArgs: usesParams ? params : null,
    parsed: results
  })

  // Print header and rows
  if (results) {
    write_fn(results);
  } else {
    log.error("Error: no results to parse");
  }
}
