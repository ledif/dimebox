'use strict'

let child_process = require('child_process')

module.exports = function() {
  const sha = child_process.execFileSync('git', ['rev-parse', 'HEAD']).toString()
  const st = child_process.execFileSync('git', ['status']).toString()
  const diff = child_process.execFileSync('git', ['diff']).toString()
  const remotes = child_process.execFileSync('git', ['remote', '-v']).toString()

  console.log(diff)

  return {
    git: {
      sha: sha,
      st: st,
      diff: diff,
      remotes: remotes
    }
  }
}
