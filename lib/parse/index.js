'use strict'

const fs = require('fs'),
      epochUtils = require('../util/epochs'),
      chalk = require('chalk'),
      log = require('loglevel'),
      dump = require('./dump'),
      parseEpoch = require('./parse-epoch')

const warn = chalk.red.bold("WARNING:")

function loadParser(parser) {
  const userHome = process.env.HOME || '~'
  const userDimeboxParserDir = userHome + '/.dimebox/parsers/'

  if (fs.existsSync(userDimeboxParserDir + '/' + parser + '.js'))
    return require(userDimeboxParserDir + '/' + parser);

  const parserInDimeboxDir = __dirname + '/../parsers/' + parser + '.js';
  
  if (!fs.existsSync(parserInDimeboxDir)) {
    log.error('Cannot find parser', parser, 'in dimebox distribution or', userDimeboxParserDir)
    process.exit(1);
  }

  try {
    return require('../parsers/' + parser);
  } catch (e) {
    log.error('Cannot load parser file in dimebox/lib/parsers/' + parser, e)
    process.exit(1);
  }
}

module.exports = function(epoch, tag, parser, agg) {
  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  // Get parser function
  const parserFn = loadParser(parser)

  // Parse the results into a structured header / rows
  const results = parseEpoch({
    epoch: epoch,
    tag: tag,
    parser: parserFn,
    shouldAggregate: agg
  })

  // Dump parsed results to file
  dump({
    epoch,
    parserName: parser,
    parser: parserFn.toString(),
    parsed: results
  })

  // Print header and rows
  log.info(results.header.join('\t'))
  results.rows.map(row => {
    log.info(row.join('\t'))
  })
}
