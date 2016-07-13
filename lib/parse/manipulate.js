'use strict'

const _ = require('lodash')

/** Convert a data frame to an array of objects */
function toObjects(df) {
  return _.map(df.rows, row => _.zipObject(df.header, row))
}

/** Convert an array of objects to a data frame */
function fromObjects(objects, header) {
  return _.map(objects, o => {
    return _.map(header, col => o[col])
  })
}

/**
 * Check if the columns specified exist in the header.
 * Coerce column name to have a leading underscore, if possible.
 *
 * @param {Array} cols - array of column names
 * @param {Array} header - header of data frame
 */
function validate(cols, header) {
  return _.map(cols, col => {
    // Return the column if it exists in the header
    if (_.findIndex(header, h => h == col) != -1) {
      return col
    // Attempt to add underscore if it doesn't exist
    } else {
      const with_underscore = '_' + col 
      if (_.findIndex(header, h => h == with_underscore) != -1)
        return with_underscore
      else
        throw Error(`Column ${col} does not appear in results`)
    }
  })
}

/**
 * Select only specific columns from a data frame
 *
 * @param {Object} df - Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} colString - Comma seperated string of column names
 */
function select(df, colString) {
  if (!colString)
    throw Error("No columns selected")

  // Get cols as an array
  const splitCols = colString.split(/\s*,\s*/)

  // Make sure all columns are valid
  const cols = validate(splitCols, df.header)

  // Indices of the columns in the header
  const colIndices = _.map(cols, col => _.findIndex(df.header, x => col == x))

  // Extract just those indices
  const header = _.map(colIndices, i => df.header[i])
  const rows = _.map(df.rows, row => {
    return _.map(colIndices, colIdx => row[colIdx])
  })

  return {header, rows}
}

/**
 * Order rows by values in specified columns
 *
 * @param {Object} df - Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} colString - Comma seperated string of column names
 */
function order(df, colString) {
  if (!colString)
    throw Error("No columns for ordering")

  // Get cols as an array
  const cols = colString.split(/\s*,\s*/)

  // Determine column order and get rid of ~
  const ordering = cols.map(col => { return col.match(/^~/) ? 'desc' : 'asc' })
  let sortColumns = cols.map(col => { return col.replace(/^~/,'') })

  // Make sure all columns are valid and coerce to underscore
  sortColumns = validate(sortColumns, df.header)

  // Convert the data frame to an array of objects
  const objects = toObjects(df)

  // Rearrange the rows
  const rearranged = _.orderBy(objects, sortColumns, ordering)

  // Convert objects back to array of rows
  const rows = fromObjects(rearranged, df.header)
  const header = df.header

  return {header: df.header, rows}
}

/**
 * Apply transformations to a data frame, similar to dplyr
 * @param {Object} df - Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} opt.sortBy - Column names to sort the rows by
 * @param {String} opt.sel - Column names to select out
 * @return {Object} transformed data frame
 */
module.exports = function(df, opt) {
  let sortBy = opt.order
  let sel = opt.select

  if (sel)
    df = select(df, sel)

  if (sortBy)
    df = order(df, sortBy)

  return df
}
