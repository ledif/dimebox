'use strict'

const fs  = require('fs'),
      log = require('loglevel'),
      dirs = require('./dirs')

module.exports = function() {
  const subdirs = ['experiments', 'experiments/jobs', 'experiments/results']
  subdirs.forEach(dir => {
    if (!fs.existsSync(dirs.build(dir))) {
      log.error(`Error: directory '${dir}' does not exist. Perhaps perform dimebox init?`)
      process.exit(1)
    }
  })
}
