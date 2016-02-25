'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      util = require('util'),
      yaml = require('js-yaml'),
      Table = require('cli-table');


module.exports = function(epoch) {
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
    try {
      const results = _.reject(
        fs.readdirSync(`${process.cwd()}/experiments/results/${epoch}`),
        filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout'; }
      )
      numResults = results.length
    } catch (e) { }

    return [epoch, expectedResults, numResults, 0, desc]
  });

  Array.prototype.push.apply(table, rows)
  console.log(table.toString());
}

