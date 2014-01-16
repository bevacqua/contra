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

gulp.task('bump', function () {
  gulp.src(['./package.json', './bower.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('tag', function () {
  var pkg = require('./package.json');
  var v = 'v' + pkg.version;
  var message = 'Release ' + v;

  gulp.src(['./package.json', './bower.json'])
    .pipe(git.commit(message));

  gulp.src('./')
    .pipe(git.tag(v, message))
    .pipe(git.push('origin', 'master'));;
});

gulp.task('default', function () {
  gulp.run('lint');
});

gulp.task('release', function () {
  sync('')
});


function sync (tasks, callback) {
    var sync = tasks.map(function(task) {
        return function (cb) {
            gulp.run(task, cb);
        };
    });
    a.series(sync, callback);
}
