'use strict'

const log = require('loglevel'),
      path  = require('path'),
      fs  = require('node-fs-extra'),
      inquirer = require('inquirer'),
      ping = require('./ping')

/**
 * Ask the user to paste their token from dimebox.xyz and
 * store it in their home directory.
 * 
 * @param {String} dir The path of the user's xyz directory 
 * @param {String} filePath The full path to store the token
 */
function promptAndWriteToken(dir, filePath) {
  fs.mkdirp(dir);

  const question = [{
    type: 'input',
    name: 'token',
    message: "Paste your token from dimebox.xyz"
  }]

  inquirer.prompt(question).then(answers => {
    const token = answers.token

    fs.writeFile(filePath, token, (err) => {
      if (err) throw err
      
      // Test the new token
      ping()
    });
  })

}

/**
 * Set up authorization token to interface with dimebox.xyz
 */
module.exports = function() {
  const home = process.env.HOME || '~'
  const xyzDir = path.join(home, '.dimebox/xyz')
  const file = path.join(xyzDir, 'auth.jwt')

  if (fs.existsSync(file)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: "Token for dimebox.xyz already exists. Overwrite anyway?",
      default: false
    }]).then(answers => {
      if (!answers.continue)
        process.exit(1);

      promptAndWriteToken(xyzDir, file)
    })
  } else {
    promptAndWriteToken(xyzDir, file)
  }
}
