var gulp = require('gulp');
var browserify = require('browserify');
var through2 = require('through2');
var rename = require("gulp-rename");


// browserify build chain
gulp.task('browserify', function () {
  gulp.src('./browser.js')
  .pipe(through2.obj(function (file, enc, next){
            browserify(file.path)
                .bundle(function(err, res){
                    // assumes file.contents is a Buffer
                    file.contents = res;
                    next(null, file);
                });
        }))
  .pipe(rename('app.js'))
  .pipe(gulp.dest('./js'));
});