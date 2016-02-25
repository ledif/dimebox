'use strict'

let _       = require('underscore'),
   generate = require('../generate'),
   init     = require('../init'),
   submit   = require('../submit')

let argv = require('yargs')
  .usage("Usage: $0 <command> [options]")
  .command('generate', 'Generate job files', {
    machine: {
      alias: 'm',
      default: 'rain'
    },
    experiment: {
      alias: 'e'
    }
  })
  .command('summary', 'Summary of experiment', {
    epoch: {
    }
  })
  .command('init', 'Initialize directory structure for experiments')
  .command('submit', 'Submit all jobs for an epoch', {
    machine: {
      alias: 'm',
      default: 'rain'
    }
  })
  .demand(1)
  .argv

console.log(argv);


if (argv._[0] == 'generate') {
  generate(argv.machine, argv.experiment);
} else if (argv._[0] == 'init') {
  init();
} else if (argv._[0] == 'submit') {
  submit(argv.machine);
}
