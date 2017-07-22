'use strict'

const push  = require('../../../xyz/push'),
      guard = require('../../../util/validate')

module.exports = {
  command: 'push [epoch]',
  desc: 'Push the current experiment set to a remote.',

  builder: {},
  handler: (argv) => {
    guard()
    push(argv.epoch)
  }
}
