'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      util = require('util'),
      yaml = require('js-yaml'),
      Q = require('q'),
      Table = require('cli-table');

var readFile = Q.nfbind(fs.readFile);

function isFailedResult(str, failureStrings) {
  return /not found/.test(str) || /Error/.test(str)  || /No such file or directory/.test(str)
}

module.exports = function(epoch) {
  const failureStrings = ''

  let epochs = fs.readdirSync(`${process.cwd()}/experiments/results/`).sort().reverse()

  let table = new Table({
    head: ['Epoch', 'expected', 'files', 'failed', 'Description'], colWidths: [17, 6, 6, 6, 100],
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''} 
   });


  let rows = _.map(epochs, epoch => {
    const resultsDir = `${process.cwd()}/experiments/results/${epoch}/`
    const runFile = `${resultsDir}/run.yml`

    let desc = '-'
    let expectedResults = '-'
    // read experiment YAML
    try {
        var exp = yaml.safeLoad(fs.readFileSync(runFile))
        desc = exp.desc
        expectedResults = _.reduce(exp.optargs, (a, b) => { return a * b.length; }, exp.p.length);
        expectedResults *= exp.cmds.length
    } catch (e) { }

    let numResults = 0
    let numFailed = 0
    try {
      const results = _.reject(
        fs.readdirSync(resultsDir),
        filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout'; }
      )

      numResults = results.length
      numFailed = _.reduce(results, (acc, filename) => {
        const resultsContent = fs.readFileSync(`${resultsDir}/${filename}`)
        return acc + isFailedResult(resultsContent, failureStrings)
      }, 0);

    } catch (e) { 
    console.log(e)}

    return [epoch, expectedResults, numResults, numFailed, desc]
  });

  Array.prototype.push.apply(table, rows)
  console.log(table.toString());
}

