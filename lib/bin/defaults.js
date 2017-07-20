'use strict'

let _       = require('lodash'),
   config   = require('..//config')

module.exports = _.extend({},
  {
    vc: true, agg: false,  stagger: false, sample: false, expfile: true,
    machine: 'rain', parser: 'default-key-value',
    sortBy: '', select: '', filter: '', format: 'tsv',
    interval: 10000, batch: 1
  },
  config.yaml('defaults'),
  {
    //give priority to a nested property if it exists
    nested: function(cmd, prop) {
      if(cmd in this && prop in this[cmd])
        return this[cmd][prop]
      return this[prop]
    }
  })
