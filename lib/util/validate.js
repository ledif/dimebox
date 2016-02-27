'use strict'

const fs  = require('fs'),
      log = require('loglevel')

module.exports = function() {
  const dirs = ['experiments', 'experiments/jobs', 'experiments/results']
  dirs.map(dir => {
    if (!fs.existsSync(dir)) {
      log.error(`Error: directory '${dir}' does not exist. Perhaps perform dimebox init?`)
      process.exit(1)
    }
  })
}
