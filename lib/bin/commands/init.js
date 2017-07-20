"use strict"

const init  = require('../../init'),
      log   = require('loglevel')

module.exports = {
  command: 'init',
  desc: 'Initialize directory structure for experiments',

  builder: {},
  handler: (argv) => {
    log.setLevel(argv.v ? 'debug' : 'info')
    init()
  }
}
