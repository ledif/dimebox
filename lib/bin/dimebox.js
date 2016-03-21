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
  .env("DIMEBOX")
  .command('generate <experiment>', 'Generate job files', yargs => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: 'rain',
        describe: "The machine where the experiments will be run."
      })
    .boolean('vc')
    .describe('vc', "Grab version control information and store with jobs.")
    .default('vc', true)
    .boolean('v')
  })
  .command('summary [epoch]', 'Summary of experiment', {
    sample: { default: true, describe: "Print a sample job file."},
    vc: { default: true, describe: "Print version control information." },
    expfile: { default: true, describe: "Print experiment config YAML file." }
  })
  .command('init', 'Initialize directory structure for experiments')
  .command('submit <epoch>', 'Submit all jobs for an epoch', yargs => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: 'rain',
        describe: "The machine where the experiments will be run."
      })
    .boolean('dry-run')
    .describe('dry-run', "Only simulate submission of jobs.")
    .boolean('stagger')
    .describe('stagger', "Set up a chain of dependent jobs so that jobs will only be scheduled k at a time.")
    .boolean('v')
    .number('batch')
    .describe('batch', "Size of batch for staggered job submission.")
    .implies('batch', 'stagger')
  })
  .command('parse [options] <epoch>', 'Parse results from a given epoch', {
    parser: {
      alias: 'p',
      default: 'default-key-value',
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
  //log.warn("Command line arguments: ", argv)

if (argv._[0] == 'generate') {
  guard();
  generate(argv.machine, argv.experiment, argv.vc);
} else if (argv._[0] == 'summary') {
  guard();
  summary(argv.epoch, argv.sample, argv.vc, argv.expfile);
} else if (argv._[0] == 'init') {
  init();
} else if (argv._[0] == 'submit') {
  guard();
  const batch = argv.batch || 1
  submit(argv.machine, argv.epoch, argv['dry-run'], argv.stagger, batch);
} else if (argv._[0] == 'parse') {
  guard();
  parse(argv.epoch, argv.tag, argv.parser);
} else if (argv._[0] == 'rm') {
  guard();
  rm(argv.epoch);
}
