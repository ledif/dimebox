'use strict'

let fs  = require('fs'),
    fse = require('node-fs-extra'),
    path = require('path')

module.exports = function() {
  fs.mkdir('experiments', err => {
    if (!err) {
      fs.mkdir('experiments/jobs', err => {})
      fs.mkdir('experiments/results', err => {})

      const exampleFilename = path.resolve(__dirname, '../examples/simple.yml');
      console.log(exampleFilename)

      fse.copy(exampleFilename, './experiments/simple.yml')
    } else {
      console.log("Cannot init", err)
    } 
  });
}

