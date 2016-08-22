'use strict'

const moment = require('moment')
const _ = require('lodash')

/**
 * @brief Class that manages a stream of activities (i.e., result starting,
 * result failed, etc.). It is essentially a time series database that can
 * be queried to retrieve activities past a certain point in time.
 */
class ActivityStream {
  constructor() {
    this.events = new Map()
    this.lastEventTime = moment("2004-09-08T08:02:17-05:00")
  }

  /**
   * @brief Compute the key for an activity. An activity's key is
   *        the result's name appended with the time in unix epoch format.
   *
   * @param {String} act.name Name of the result
   * @param {moment} act.modified Time when this activity occured
   */
  key(act) {
     return `${act.name}${act.modified.format('x')}`
  }

  /**
   * @brief Add a set of activities to the stream.
   *
   * @param {Array} activities An array of activity objects, each with name and time.
   */
  add(activities) {
    _.each(activities, act => {
      const key = this.key(act)
      //if (!this.events.has(key))
        this.events.set(key, act)
    })
  }

  /**
   * @brief Retrieve a set of activities that have occured since the last time
   *        this function was called.
   * @return {Array} An array of activity objects, each with name and time.
   */
  since() {
    const latest = _.filter(Array.from(this.events.values()), act => {
      return act.modified.isAfter(this.lastEventTime)
    })

    // Update the latest time if there's been a new activity
    if (latest.length > 0) {
      const newest = _.maxBy(latest, act => { return act.modified })
      this.lastEventTime = newest.modified
    }

    // Return new activites sorted by time
    return _.sortBy(latest, 'modified')
  }
}


module.exports = ActivityStream;
