"use strict"

const parse    = require('../../parse'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'parse <epoch> [params...]',
  desc: 'Parse results from a given epoch',

  builder: (yargs) => {
    return yargs
      .option('parser', {
        alias: 'p',
        default: defaults.nested('parse', 'parser'),
        describe: "Parser used to extract information from each line."
      })
      .option('tag', {
        alias: 't',
        default: 'default',
        describe: "The tag for the results to show."
      })
      .boolean('agg')
      .default('agg', defaults.nested('parse', 'agg'))
      .describe('agg', "For results that have the same key-values, summarize into mean, stddev, etc.")
      .option('sortBy', {
        alias: 's',
        default: defaults.nested('parse', 'sortBy'),
        describe: "List of columns to sort output by, e.g. cmd, p, etc."
      })
      .option('select', {
        default: defaults.nested('parse', 'select'),
        describe: "Only print the specified columns"
      })
      .option('filter', {
        alias: 'f',
        default: defaults.nested('parse', 'filter'),
        describe: "Predicate expression to filter rows by"
      })
      .option('format', {
        default: defaults.nested('parse', 'format'),
        describe: "Output format"
      })
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    parse({
      epoch: argv.epoch,
      tag: argv.tag,
      parser: argv.parser,
      agg: argv.agg,
      sortBy: argv.sortBy,
      select: argv.select,
      filter: argv.filter,
      format: argv.format,
      params: argv.params,
    })
  }
}
