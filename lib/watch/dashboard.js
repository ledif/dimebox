'use strict'

const fs = require('fs')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const _ = require('lodash')
const log = require('loglevel')
const chalk = require('chalk')
const moment = require('moment')
const ActivityStream = require('./activity-stream')
const dirs = require('../util/dirs')

const util = require('util');

function asStrings(row) {
  return _.map(row, col => String(col))
}

// Compute the row for a given result
function colorForState(state) {
    switch (state) {
      case "failed": return chalk.red
      case "done": return chalk.green
      case "started": return chalk.yellow
      case "waiting": return chalk.gray
      default:
        log.error("Unknown state", state)
        //process.exit(1)
    }
}

class Dashboard {
  constructor(epoch) {
    this.epoch = epoch
    this.activityStream = new ActivityStream();

    this.screen = blessed.screen()
    this.grid = new contrib.grid({rows: 12, cols: 6, screen: this.screen})

    this.screen.key(['escape', 'q', 'C-c'], (ch, key) => {
      // If a results box is currently displayed
      if (this.resultBox) {
        this.resultBox.detach()
        this.screen.render();
        this.resultBox = null
        return 0;
      }

      // Else exit the program
      return process.exit(0);
    });

    // Heading
    this.headingName = this.grid.set(0,0,1,4, blessed.Box, {align: 'center'})
    this.headingInfo = this.grid.set(0,4,1,2, blessed.Box, {align: 'center'})

    // Progress bar
    this.progress = this.grid.set(8,3,4,3, contrib.donut, {
     label: 'Progress',
     radius: 8,
     arcWidth: 3,
     remainColor: 'black',
     yPadding: 2
    })


    // Activity log
    this.log = this.grid.set(8,0,4,3, contrib.log, {
         label: 'Activity'
    })

    // Results
    this.table = this.grid.set(1,0,7,6, contrib.table, {
       keys: true
       , fg: 'white'
       , selectedFg: 'white'
       , selectedBg: 'blue'
       , interactive: true
       , label: 'Results'
       , border: {type: "line", fg: "cyan"}
       , columnSpacing: 3 //in chars
       , columnWidth: [3, 3, 6, 6, 6, 6, 6]
    })
    this.table.focus()

    this.table.rows.on('select', node => {
      this.result(node.parent.selected)
    })
  }

  /** Show a single result */
  result(index) {
    const name = this.resultsList[index].name

    // Open the file
    const filename = `${dirs.results()}/${this.epoch}/${name}`
    const contents = fs.readFileSync(filename).toString()

    this.resultBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '100%',
      height: '100%',
      label: name,
      content: contents,
      tags: true,
      border: {
        type: 'line'
      },
      scrollable: true,
      keys: true,
      vi: true,
      input: true
    });

    this.screen.append(this.resultBox);
    this.resultBox.focus()
    this.screen.render();
  }

  /** Add a set of activites to the dashboard. Only updates if there are new activites. */
  activities(acts) {
    this.activityStream.add(acts)
    const newActivities = this.activityStream.since()

    _.each(newActivities, act => {
      const timestamp = act.modified.format("YYYY-MM-DD hh:mm")
      const lineColor = colorForState(act.state)
      this.log.log(lineColor(`${timestamp} - ${act.state}: ${act.name}`+'\n'))
    })
  }

  /** Set header information on the screen */
  header(name, info) {
    this.headingName.setContent(name)
    this.headingInfo.setContent(info)
  }

  /**
   * @brief Display the status of all results
   */
  results(header, rows, results) {
    this.resultsList = results

    const widths = _.chain(_.concat(rows, [header])) // Combine rows with header
      .unzip() // Get columns
      .drop(1) // Drop the state column
      .map(col => { // Map each column to its max length as string
        const longest = _.maxBy(col, field => String(field).length)
        return String(longest).length
      })
      .map(length => length+2) // Add some room for padding
      .value()
   
    this.table.options.columnWidth = _.concat([3], widths),

    this.table.setData({
      headers: asStrings(header),
      data: _.map(rows, asStrings)
    })
  }

  /** Update progress information */
  prog(val) {
    this.progress.setData([{percent: val, label: "done"}])
  }

  /** Render the dashboard to the screen */
  render() { this.screen.render() }
}

module.exports = Dashboard;
