'use strict'

let fs  = require('fs'),
    fse = require('node-fs-extra'),
    path = require('path'),
    log = require('loglevel')

module.exports = function() {
  if (fs.existsSync('experiments')) {
    log.error("Error: already a dimebox experiment set.")
    process.exit(1)
  }

  fs.mkdir('experiments', err => {
    if (!err) {
      fs.mkdir('experiments/jobs', err => {})
      fs.mkdir('experiments/results', err => {})

      const exampleFilename = path.resolve(__dirname, '../examples/exp.yml');
      log.debug(`Copied ${exampleFilename}`)

      fse.copy(exampleFilename, './experiments/exp.yml')
    } else {
      log.error("Cannot init", err)
    }
  });
}

