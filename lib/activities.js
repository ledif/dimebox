'use strict'

const epochUtils = require('./util/epochs'),
      colorUtils = require('./util/colors'),
       _      = require('lodash'),
      log     = require('loglevel'),
      ActivityStream = require('./watch/activity-stream')

/** @brief Pad a number with leading zeroes based on the maximum value that
 *         it could take.
 *
 *  @note Pretty sure this might be the least efficient way to do this
 */
function padZeroes(x, max) {
  if (x > max)
    throw Exception("First argument needs to be smaller than the second")

  let xString = x.toString()

  const xDigits = xString.length
  const maxDigits = max.toString().length

  if (maxDigits == xDigits)
    return xString

  while (xString.length < maxDigits) {
    xString = '0' + xString;
  }

  return xString
}

function update(epoch, numExpectedActivities, activityCounter, activityStream) {
    // Add activities
    const acts = epochUtils.activities(epoch)
    activityStream.add(acts)
    const newActivities = activityStream.since()

    _.each(newActivities, act => {
      activityCounter = activityCounter + 1
      const paddedActivities = padZeroes(activityCounter, numExpectedActivities)
      const counterText =`(${paddedActivities}/${numExpectedActivities})`
      const statusChar = colorUtils.statusCharacter(act.state)
      log.info(`${statusChar} ${counterText} ${act.state}: ${act.name}`)
    })

  return activityCounter
}

module.exports = function(epoch, interval) {
  // Resolve symbolic epoch
  epoch = epochUtils.resolve(epoch)

  const initialStatus = epochUtils.status(epoch)
  const numExpected = initialStatus.expected.length;
  const numExpectedActivities = numExpected*2;


  let activityStream = new ActivityStream();
  let activityCounter =
    update(epoch, numExpectedActivities, 0, activityStream)

  // Loop forever, printing results
  setInterval(() => {
    activityCounter =
      update(epoch, numExpectedActivities, activityCounter, activityStream)

    if (activityCounter == numExpectedActivities)
      process.exit(0)

  }, interval)
}
