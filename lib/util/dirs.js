'use strict'

let path = require("path")

// Find the directory above experiments/
function base() {
  const cwd = process.cwd()

  if (path.basename(cwd) == "experiments")
    return path.dirname(cwd)

  return cwd
}

// Build up file paths relative to base()
const build = path.join.bind(null, base())

module.exports = {
  base: base,
  build: build,
  jobs: build.bind(this, "experiments", "jobs"),
  results: build.bind(this, "experiments", "results"),
  workspaces: build.bind(this, "experiments", "workspaces")
}
