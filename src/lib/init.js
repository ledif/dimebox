'use strict'

let fs  = require('fs'),
    fse = require('node-fs-extra'),
    path = require('path'),
    log = require('loglevel'),
    setMetadata = require('./set-metadata')

module.exports = function() {
  if (fs.existsSync('experiments')) {
    log.error("Error: already a dimebox experiment set.")
    process.exit(1)
  }

  try {
    const dirs = ['experiments/jobs', 'experiments/results', 'experiments/metadata']
    dirs.forEach(dir => { fse.mkdirp(dir); })

    const exampleFilename = path.resolve(__dirname, '../../examples/exp.yml');
    fse.copy(exampleFilename, './experiments/exp.yml')
    log.debug(`Copied ${exampleFilename}`)

    setMetadata()
  } catch (err) {
    log.error("Cannot init", err)
  }
}

