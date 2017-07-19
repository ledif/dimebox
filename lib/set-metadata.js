'use strict'

const fs = require('node-fs-extra'),
      _ = require('lodash'),
      path = require("path"),
      log = require('loglevel'),
      inquirer = require('inquirer'),
      uuidv4 = require('uuid/v4'),
      yaml    = require('js-yaml'),
      vcs = require("./util/vcs"),
      dirs = require("./util/dirs"),
      machine = require("./generate/machine"),
      version = require("./util/version")

function writeMetadata(mdFile) {
  const versionControl = vcs();
  const uuid = uuidv4();
  const machineInfo = machine();

  const question = [{
    type: 'input',
    name: 'description',
    message: "What is this set of experiments for?"
  }]

  inquirer.prompt(question).then(answers => {
    const desc = answers.description

    const md = {
      version: version,
      description: desc,
      uuid: uuid,
      vc: versionControl,
      machine: machineInfo
    }

    fs.writeFile(mdFile, yaml.safeDump(md), (err) => { if (err) throw err });
  })
}

/**
 * Set metadata for experiment set
 */
module.exports = function() {
  // Create metadata directory
  fs.mkdirp(dirs.metadata())
  const mdFile = path.join(dirs.metadata(), "expset.yml")

  if (fs.existsSync(mdFile)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: "Metadata already exists. Overwrite anyway?",
      default: false
    }]).then(answers => {
      if (!answers.continue)
        process.exit(1);

      writeMetadata(mdFile) 
    })
  } else {
    writeMetadata(mdFile)
  }
}
