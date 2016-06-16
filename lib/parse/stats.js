'use strict'

const _ = require('lodash')

module.exports = function(values) {
  const samples = values.length

  const min = _.min(values)
  const max = _.max(values)
  const mean = _.mean(values)

  const t_vals = 
    [ 12.70620, 4.30265, 3.18245, 2.77645, 2.57058, 2.44691, 2.36462, 2.30600,
       2.26216, 2.22814, 2.20099, 2.17881, 2.16037, 2.14479, 2.13145, 2.11991,
       2.10982, 2.10092, 2.09302, 2.08596, 2.07961, 2.07387, 2.06866, 2.06390,
       2.05954, 2.05553, 2.05183, 2.04841, 2.04523, 2.04227 ]
  const inf_t_vals = 1.95996;

  const variance = _.sumBy(values, x => Math.pow(x-mean,2))/values.length 
  const stddev = Math.sqrt(variance);

  const t_val = values.length > 30 ?
    inf_t_vals : t_vals[values.length-1];

  const conf = (t_val*stddev) / Math.sqrt(values.length);

  return { mean, min, max, conf, stddev, samples }
}
