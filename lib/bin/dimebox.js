'use strict'

let _       = require('underscore'),
   log      = require('loglevel'),
   generate = require('../generate'),
   init     = require('../init'),
   summary  = require('../summary'),
   submit   = require('../submit'),
   parse    = require('../parse'),
   rm       = require('../rm'),
   resolve  = require('../resolve'),
   watch    = require('../watch'),
   guard    = require('../util/validate'),
   config   = require('../config')

let defaults = _.extend({},
  {
    vc: true, agg: false,  stagger: false, sample: true, expfile: true,
    machine: 'rain', parser: 'default-key-value',
    interval: 10000, batch: 1
  },
  config.yaml('defaults'),
  {
    //give priority to a nested property if it exists
    nested: function(cmd, prop) {
      if(cmd in this && prop in this[cmd])
        return this[cmd][prop]
      return this[prop]
    }
  })


let argv = require('yargs')
  .usage("Usage: $0 <command> [options]")
  .env("DIMEBOX")
  .command('generate <experiment>', 'Generate job files', yargs => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: defaults.nested('generate', 'machine'),
        describe: "The machine where the experiments will be run."
      })
    .boolean('vc')
    .describe('vc', "Grab version control information and store with jobs.")
    .default('vc', defaults.nested('generate','vc'))
    .boolean('v')
  })
  .command('summary [epoch]', 'Summary of experiment', {
    sample: { default: defaults.nested('summary', 'sample'), describe: "Print a sample job file."},
    vc: { default: defaults.nested('summary', 'vc'), describe: "Print version control information." },
    expfile: { default: defaults.nested('summary', 'expfile'), describe: "Print experiment config YAML file." }
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
    .default('stagger', defaults.nested('submit', 'stagger'))
    .boolean('v')
    .number('batch')
    .describe('batch', "Size of batch for staggered job submission.")
    .implies('batch', 'stagger')
  })
  .command('parse [options] <epoch>', 'Parse results from a given epoch', yargs => {
    return yargs
      .option('parser', {
        alias: 'p',
        default: defaults.nested('parse', 'parser'),
        describe: "Parser used to extract information from each line."
      })
      .option('tag', {
        alias: 't',
        default: 'default',
        describe: "The tag for the results to show."
      })
      .boolean('agg')
      .default('agg', defaults.nested('parse', 'agg'))
      .describe('agg', "For results that have the same key-values, summarize into mean, stddev, etc.")
  })
  .command('watch [options] <epoch>', 'Monitor the status of results for a given epoch.', {
    interval: {
      default: defaults.nested('watch', 'interval'),
      describe: "Interval in ms to watch for changes"
    }
  })
  .command('rm <epoch>', 'Remove the jobs and results for a given epoch.')
  .command('resolve <epoch>', 'Resolve a symbolic epoch to concrete epoch.')
  .completion("completion", "Output .bashrc completion script.")
  .example('dimebox generate --machine vulcan exp.yml', "Generate job files for the experiment described in exp.yml for the machine 'vulcan'")
  .example('dimebox submit --machine vulcan HEAD', "Submit job files for the last generated experiment.")
  .demand(1)
  .boolean('v')
  .help()
  .argv

log.setLevel(argv.v ? 'debug' : 'info')
log.debug("Command line arguments: ", argv)

const handler = {
  routes: {
    generate: () => generate(argv.machine, argv.experiment, argv.vc),
    summary: () => summary(argv.epoch, argv.sample, argv.vc, argv.expfile),
    init: () => init(),
    parse: () => parse(argv.epoch, argv.tag, argv.parser, argv.agg),
    rm: () => rm(argv.epoch),
    resolve: () => resolve(argv.epoch),
    watch: () => watch(argv.epoch, argv.interval),
    submit: () => {
      const batch = argv.batch || defaults.nested('submit', 'batch')
      submit(argv.machine, argv.epoch, argv['dry-run'], argv.stagger, batch);
    },
  },
  guarded: ["generate", "summary", "submit", "parse", "rm", "resolve", "watch"]
}


const command = argv._[0];

if (command in handler.routes) {
   // Make sure that we're running in a dimebox directory
   if (_.contains(handler.guarded, command))
     guard()

   handler.routes[command]();
} else {
  log.error(`Error: unknown command ${command}. Consult dimebox --help for usage.`)
  process.exit(1)
}
