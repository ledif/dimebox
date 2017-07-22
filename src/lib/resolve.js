'use strict'

const log = require('loglevel'),
      epochUtils = require('./util/epochs')

module.exports = function(epoch) {
  const resolved = epochUtils.resolve(epoch)

  log.info(resolved)
}

