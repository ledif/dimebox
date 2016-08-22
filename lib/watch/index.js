'use strict'

const _ = require('lodash')
const watch = require('./watch')
const chalk = require('chalk')
const Dashboard = require('./dashboard')
const epochUtils = require('../util/epochs')

/**
 * @brief Update the dashboard based on current status
 * @param {String} epoch Concrete epoch
 * @param {Object} exp The experimental description
 * @param {Object} dash The current dashboard
 */
function updateFrame(epoch, exp, dash) {
  // Get updated information
  const stat = watch.currentStatus(epoch, exp)

  // Colorize counts of each category
  const done = chalk.green(stat.expinfo.done)
  const failed = chalk.red(stat.expinfo.failed)
  const started = chalk.yellow(stat.expinfo.started)
  const waiting = chalk.gray(stat.expinfo.waiting)

  // Print header
  let headerName = `${stat.expinfo.name}: ${stat.expinfo.desc}`
  let headerInfo = `${stat.expinfo.epoch} (${done}/${failed}/${started}/${waiting})`
  dash.header(headerName, headerInfo)

  // Activities
  const acts = epochUtils.activities(epoch)
  dash.activities(acts)

  // Results
  dash.results(stat.results.header, stat.results.rows, stat.combined)

  // Progress
  const numResults = Number(stat.expinfo.done) + Number(stat.expinfo.failed) + Number(stat.expinfo.started) + Number(stat.expinfo.waiting)
  const numFinishedResults = Number(stat.expinfo.done) + Number(stat.expinfo.failed)

  dash.prog(Math.round((numFinishedResults/numResults)*100))

  // Render to screen
  dash.render()
}

module.exports = function(epoch, interval) {
  // Resolve symbolic epoch
  epoch = epochUtils.resolve(epoch)

  // Get the experiment params
  const exp = epochUtils.exp(epoch)

  let dash = new Dashboard(epoch)
  updateFrame(epoch, exp, dash)

  // Loop forever, printing results
  setInterval(() => {
    updateFrame(epoch, exp, dash)
  }, interval)
}
