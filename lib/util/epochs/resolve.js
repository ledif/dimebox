"use strict"

const  _   = require('lodash'),
     log  = require('loglevel')

// Resolve a symbolic epoch (e.g., HEAD~~) to a concrete epoch
//
// HEAD is first item in the list
// HEAD~~ is the third item in the list
// HEAD~3 is the fourth item in the list
module.exports = function(epoch, epochs) {
  // Passed in a concrete epoch
  if (!epoch.match(/^HEAD/))
    return epoch;

  // At this point, only working with things that start with HEAD

  let numPrev = (epoch.match(/~/g) || []).length

  // Add all numbers in the epoch to the running sum
  const nums = epoch.match(/(\d+)/g)
  if (nums) {
    numPrev += _.sumBy(nums, x => Number(x))-nums.length
  }

  if (numPrev > epochs.length-1)
    throw Error(`Symbolic epoch ${epoch} goes past current set of epochs`)

  log.debug("Resolved epoch to ", epochs[numPrev])
  return epochs[numPrev]
}
