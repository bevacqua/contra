'use strict';

var gulp = require('gulp');
var bump = require('gulp-bump');
var git = require('gulp-git');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var clean = require('gulp-clean');
var rename = require('gulp-rename');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var size = require('gulp-size');

var extended = [
  '/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''
].join('\n');

var succint = '// <%= pkg.name %>@v<%= pkg.version %>, <%= pkg.license %> licensed. <%= pkg.homepage %>\n';

gulp.task('lint', function () {
  return gulp.src('./src/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('mocha', function () {
  gulp.src('./test/**/*.js')
    .pipe(mocha({ reporter: 'list' }));
});

gulp.task('clean', function () {
  return gulp.src('./dist', { read: false })
    .pipe(clean());
});

gulp.task('build-shim', ['bump', 'test', 'clean'], function () {
  var pkg = require('./package.json');

  return gulp.src('./src/contra.shim.js')
    .pipe(header(extended, { pkg : pkg } ))
    .pipe(gulp.dest('./dist'))
    .pipe(rename('contra.shim.min.js'))
    .pipe(uglify())
    .pipe(header(succint, { pkg : pkg } ))
    .pipe(size())
    .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['build-shim'], function () {
  var pkg = require('./package.json');

  return gulp.src('./src/contra.js')
    .pipe(header(extended, { pkg : pkg } ))
    .pipe(gulp.dest('./dist'))
    .pipe(rename('contra.min.js'))
    .pipe(uglify())
    .pipe(header(succint, { pkg : pkg } ))
    .pipe(size())
    .pipe(gulp.dest('./dist'));
});

gulp.task('bump', function () {
  var bumpType = process.env.BUMP || 'patch'; // major.minor.patch

  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump({ type: bumpType }))
    .pipe(gulp.dest('./'));
});

gulp.task('tag', ['build'], function () {
  var pkg = require('./package.json');
  var v = 'v' + pkg.version;
  var message = 'Release ' + v;

  return gulp.src('./')
    .pipe(git.commit(message))
    .pipe(git.tag(v, message))
    .pipe(git.push('origin', 'master', '--tags'))
    .pipe(gulp.dest('./'));
});

gulp.task('npm', ['tag'], function (done) {
  require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' })
    .on('close', done);
});

gulp.task('test', ['lint', 'mocha']);
gulp.task('ci', ['build']);
gulp.task('release', ['npm']);
