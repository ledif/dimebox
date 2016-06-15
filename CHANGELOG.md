# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- Subcommand `watch`, which allows for a user to monitor the status of an epoch
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
