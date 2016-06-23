'use strict'

const fs = require('node-fs-extra'),
      log = require('loglevel'),
      crypto = require('crypto'),
      dirs = require('../util/dirs')

// Dump parsed experiment to a file
module.exports = function(opt) {
  const parsed = opt.parsed
  const epoch = opt.epoch
  const parserName = opt.parserName
  const parser = opt.parser

  const parserHash =  crypto.createHash('sha1').update(parser).digest('hex')

  let results = {
    kv: {
      header: parsed.header,
      rows: parsed.rows
    },
    parser: {
      name: parserName,
      sha1: parserHash
    },
    failed: parsed.failed
  }

  const fname = dirs.results(epoch, '.parsed', 'results.json')
  fs.outputJSONSync(fname, results, {spaces:5})
}
