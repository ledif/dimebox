'use strict'

const _ = require('lodash')

/* Convert a data frame to an array of objects
 */
function toObjects(df) {
  return _.map(df.rows, row => _.zipObject(df.header, row))
}

/* Convert an array of objects to a data frame
 */
function fromObjects(objects, header) {
  return _.map(objects, o => {
    return _.map(header, col => o[col])
  })
}

/* Validate that the columns passed in make sense
 *
 * @param {Array} cols: array of column names
 * @param {Array} header: header of data frame
 */
function validate(cols, header) {
  _.forEach(cols, col => {
    if (_.findIndex(header, h => h == col) == -1)
      throw Error(`Column ${col} does not appear in results`)
  })
}

/* Select only specific columns from a data frame
 *
 * @param {Object} df: Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} colString: Comma seperated string of column names
 */
function select(df, colString) {
  if (!colString)
    throw Error("No columns selected")

  // Get cols as an array
  const cols = colString.split(/\s*,\s*/)

  // Make sure all columns are valid
  validate(cols, df.header)

  // Indices of the columns in the header
  const colIndices = _.map(cols, col => _.findIndex(df.header, x => col == x))

  // Extract just those indices
  const header = _.map(colIndices, i => df.header[i])
  const rows = _.map(df.rows, row => {
    return _.map(colIndices, colIdx => row[colIdx])
  })

  return {header, rows}
}

/* Order rows by values in specified columns
 *
 * @param {Object} df: Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} colString: Comma seperated string of column names
 */
function order(df, colString) {
  if (!colString)
    throw Error("No columns for ordering")

  // Get cols as an array
  const cols = colString.split(/\s*,\s*/)

  // Determine column order and get rid of ~
  const ordering = cols.map(col => { return col.match(/^~/) ? 'desc' : 'asc' })
  const sortColumns = cols.map(col => { return col.replace(/^~/,'') })

  // Make sure all columns are valid
  validate(sortColumns, df.header)

  // Convert the data frame to an array of objects
  const objects = toObjects(df)

  // Rearrange the rows
  const rearranged = _.orderBy(objects, sortColumns, ordering)

  // Convert objects back to array of rows
  const rows = fromObjects(rearranged, df.header)
  const header = df.header

  return {header: df.header, rows}
}

// Apply manipulates to the data, similar to dplyr
module.exports = function(df, opt) {
  let sortBy = opt.order
  let sel = opt.select

  if (sel)
    df = select(df, sel)

  if (sortBy)
    df = order(df, sortBy)

  return df
}
