'use strict'

let child_process = require('child_process')

module.exports = function() {
  // Test if it's a git repo
  try {
    child_process.execFileSync('git', ['rev-parse', 'HEAD'], {stdio: 'ignore'})
  } catch (e) {
    return null
  }

  const sha = child_process.execFileSync('git', ['rev-parse', 'HEAD']).toString()
  const st = child_process.execFileSync('git', ['status']).toString()
  const diff = child_process.execFileSync('git', ['diff']).toString()
  const remotes = child_process.execFileSync('git', ['remote', '-v']).toString()

  return {
    git: {
      sha: sha,
      st: st,
      diff: diff,
      remotes: remotes
    }
  }
}
