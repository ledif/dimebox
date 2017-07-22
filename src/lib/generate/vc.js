'use strict'

const _              = require('lodash'),
     crypto          = require('crypto'),
     fs              = require('fs'),
     chalk           = require('chalk'),
     log             = require('loglevel'),
     vcs             = require('../util/vcs')

const warn = chalk.red.bold("WARNING:")

// Get MD5 hash of executables in expfile
function executable(exp) {
  const cmds = exp.cmds

  let info = {};

  _.each(cmds, (cmd, key) => {
    const exeFilename = cmd.split(" ")[0];

    try {
      const exe = fs.readFileSync(exeFilename)
      const md5 = crypto.createHash('md5').update(exe).digest('hex')

      info[exeFilename] = {md5: md5}

    // Can't read exe file
    } catch (e) {
      log.warn(warn, `can't open executable ${exeFilename} for reading.`)
    }
  })

  return {exe: info};
}

module.exports = function(exp) {
  const g = vcs();
  const exe = executable(exp);

  return _.extend({}, g, exe);
}
