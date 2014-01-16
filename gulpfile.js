var gulp = require('gulp');
var bump = require('gulp-bump');
var git = require('gulp-git');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var a = require('./src/a.js');

gulp.task('lint', function () {
  gulp.src('./{src,test}/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('release-bump', function () {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

function v () {
  var pkg = require('./package.json');
  return 'v' + pkg.version;
}

function message () {
  return 'Release ' + v();
}

gulp.task('release-commit', ['release-bump'], function () {
  return gulp.src('./')
    .pipe(git.commit(message()))
    .pipe(gulp.dest('./'));
});

gulp.task('release-tag', ['release-commit'], function () {
  gulp.src('./')
    .pipe(git.tag(v(), message()))
    .pipe(git.push('origin', 'master'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['lint']);
gulp.task('release', ['release-tag']);
