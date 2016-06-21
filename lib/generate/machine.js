'use strict'

const child_process = require('child_process')

// Try to execute a command and if it throws, return null.
function exec(cmd, args) {
  try {
    return child_process.execFileSync(cmd, args).toString().trim()
  } catch(e) {
    return null;
  }
}

// Gather information about the machine
module.exports = function(exp) {
  const hostname = exec('/bin/hostname')
  const uname = exec('/bin/uname', ['-a'])
  const env = process.env

  return {hostname, uname, env}
}
