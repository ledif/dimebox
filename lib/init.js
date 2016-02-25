'use strict'

let fs = require('fs');

module.exports = function() {
  fs.mkdir('experiments', err => {
    if (!err) {
      fs.mkdir('experiments/jobs', err => {})
      fs.mkdir('experiments/results', err => {})
    } else {
      console.log("Cannot init", err)
    } 
  });
}

