'use strict'

let _       = require('underscore'),
   log      = require('loglevel'),
   generate = require('../generate'),
   init     = require('../init'),
   summary  = require('../summary'),
   submit   = require('../submit'),
   parse    = require('../parse'),
   rm       = require('../rm'),
   guard    = require('../util/validate')

let argv = require('yargs')
  .usage("Usage: $0 <command> [options]")
  .command('generate <experiment>', 'Generate job files', {
    machine: {
      alias: 'm',
      default: 'rain',
      describe: "The machine to generate jobs for."
    },
  })
  .command('summary [epoch]', 'Summary of experiment', {
    sample: { default: true, describe: "Print a sample job file."},
    vc: { default: true, describe: "Print version control information." },
    expfile: { default: true, describe: "Print experiment config YAML file." }
  })
  .command('init', 'Initialize directory structure for experiments')
  .command('submit <epoch>', 'Submit all jobs for an epoch', {
    machine: {
      alias: 'm',
      default: 'rain',
      describe: "The machine where the experiments will be run."
    },
    'dry-run': {
      default: false,
      describe: "Only print the jobs that would be submitted."
    }
  })
  .command('parse <epoch>', 'Parse results from a given epoch', {
    parser: {
      alias: 'p',
      default: 'key-value-parser',
      describe: "Parser used to extract information from each line."
    },
    tag: {
      alias: 't',
      default: 'default',
      describe: "The tag for the results to show."
    },
  })
  .command('rm <epoch>', 'Remove the jobs and results for a given epoch.')
  .example('$0 generate --machine vulcan exp.yml', "Generate job files for the experiment described in exp.yml for the machine 'vulcan'")
  .example('$0 submit --machine vulcan HEAD', "Submit job files for the last generated experiment.")
  .demand(1)
  .boolean('v')
  .help()
  .argv

  log.setLevel(argv.v ? 'debug' : 'info')
  log.debug("Command line arguments: ", argv)

if (argv._[0] == 'generate') {
  guard();
  generate(argv.machine, argv.experiment);
} else if (argv._[0] == 'summary') {
  guard();
  summary(argv.epoch, argv.sample, argv.vc, argv.expfile);
} else if (argv._[0] == 'init') {
  init();
} else if (argv._[0] == 'submit') {
  guard();
  submit(argv.machine, argv.epoch, argv['dry-run']);
} else if (argv._[0] == 'parse') {
  guard();
  parse(argv.epoch, argv.tag, argv.parse);
} else if (argv._[0] == 'rm') {
  guard();
  rm(argv.epoch);
}
