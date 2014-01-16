var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('lint', function () {
  gulp.src('./src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('default', function () {
  gulp.run('lint');
});
