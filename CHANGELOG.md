# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.6.0] 2017-09-29
### Added
- Support for hosted dimebox service https://dimebox.xyz.
- Support for the Cori machine.

### Changed
- Internal restructuring of CLI commands

## [1.5.0] 2017-07-19
### Added
- New `pairargs` keyword for experiment specification which allows argument combinations
  to be pairwise  instead of a cross-product.
- New `prologue` keyword for experiment specification which can run arbitrary commands
  when a job starts
- User-defined parsing can now be objects with various helper functions (`onInit`, `onNewFile`, `parseLine`).
- New regex parser that can use command line options to specify what to parse as a regular expression
- The output of `dimebox parse` can be specified to be either TSV or JSON

### Changed
- Improved SVN version control extraction
- `watch` will no longer open result files that do not exist
- The `weakargs` specification uses the same eval code as filter
- The `weakargs` specification can now use the `$depth` variable

### Bugfixes
- Fixed issue where batch size was not taken into account for stagger
- Local machine now uses bash instead of sh
- Fixed width issue with `dimebox summary`

## [1.4.0] 2016-09-20
### Added
- Support for raw flags in experiment files that can be passed to job headers or run flags directly.

### Changed
- Richer interface for `watch` that is more interactive. 
- Fixed bug with job creation on edison machine
- Fixed bug where walltime in files were not correctly interpreted as times

## [1.3.0] 2016-07-21
### Added
- Subcommand `kill`, which allows a user to cancel all submitted jobs for an epoch
- User defaults for all commands can now be read in from $HOME/.dimebox/defaults.yml
- `parse` now has options to select specific columns, sort rows or filter rows
- Custom machine configurations can now be created and placed in $HOME/.dimebox/machines
- Support for machine Edison (edison.nersc.gov)
- Bash completition script in tools/
- Dump of machine information when generating jobs in jobs/$epoch/machine.yml

### Changed
- Result files can contain more than one observation with the dbx.obs keyword, allowing for tidy data when using `parse`.
- Cleaner output for `watch` subcommand which includes time of last status update
- Turned off sample job display in `summary` by default to cut down on noise

## [1.2.0] - 2016-06-16
### Added
- Subcommand `watch`, which allows for a user to monitor the status of an epoch
- `parse` now allows for aggregation of numeric values with the same key into mean, stddev and other statistics with the --agg flag. Combined with the `trials` parameter in the expfile, this allows for multiple runs to be aggregated and parsed into one output.
- Adding richer symbolic epoch syntax (e.g., HEAD~~ is the third to last experiment).
- Version control information is now captured for SVN repos as well as git
- Metadata for result files are now stored in `$epoch/.md$ as structured YAML data. 

### Changed
- Failures during runs (non-zero exit codes) are now recorded by touching a file in the a `$epoch/.fail` directory in results. This replaces the need for searching all files for failure strings. All previous experiment sets will have incorrect counts for number of failed files.
- optarg values that have spaces no longer cause problems with generated filenames with spaces

## [1.1.0] - 2016-06-04
### Added
- The commands `generate`, `summary`, `init`, `submit`, `parse`, `rm`, and `resolve`.
- Support for the 'rain' and 'vulcan' platforms.
- Basic support for key-value extraction from result files

## [1.0.0] - 2016-02-24
### Added
- Initial version.
