'use strict'

let _       = require('underscore'),
   generate = require('../generate'),
   init     = require('../init'),
   summary  = require('../summary'),
   sample   = require('../sample'),
   submit   = require('../submit')

let argv = require('yargs')
  .usage("Usage: $0 <command> [options]")
  .command('generate <experiment>', 'Generate job files', {
    machine: {
      alias: 'm',
      default: 'rain'
    },
  })
  .command('summary [epoch]', 'Summary of experiment')
  .command('sample [epoch]', 'Show a sample job from a given epoch')
  .command('init', 'Initialize directory structure for experiments')
  .command('submit [epoch]', 'Submit all jobs for an epoch', {
    machine: {
      alias: 'm',
      default: 'rain'
    },
    dryrun: {
      default: false
    }
  })
  .demand(1)
  .help()
  .argv

//console.log(argv);

if (argv._[0] == 'generate') {
  generate(argv.machine, argv.experiment);
} else if (argv._[0] == 'summary') {
  summary(argv.epoch);
} else if (argv._[0] == 'init') {
  init();
} else if (argv._[0] == 'submit') {
  submit(argv.machine, argv.epoch, argv.dryrun);
} else if (argv._[0] == 'sample') {
  sample(argv.epoch);
}
