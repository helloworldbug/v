var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var del = require("del");

var gulpSequence = require('gulp-sequence');
var browserify = require('browserify');
var sourcemaps = require("gulp-sourcemaps");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var replace = require('gulp-replace');
var destDir = "dist";

gulp.task('default', ['develop']);

gulp.task('develop', gulpSequence('clean', ['_develop:css', '_develop:js']));

/**
 * 每次生成之前清除之前生成的
 */
gulp.task('clean', function (done) {
    del(["./display/css/mobile.min.css","./display/js/controller/mobile.min.js"]).then(function () {
        done();
    });
});

gulp.task('_develop:css', function () {
    return gulp.src("css/mobile.scss")
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('display/css/'))

});

gulp.task('_develop:js', function () {
    var b = browserify({
        entries: "./js/mobile.js",
        debug: true
    });
    return b.bundle()
        .pipe(source("mobile.min.js"))
        .pipe(buffer())
    //    .pipe(sourcemaps.init({loadMaps: true}))
    //    .pipe(sourcemaps.write("."))
       .pipe(uglify())
        .pipe(gulp.dest("display/js/controller/"));
});
gulp.task('release', gulpSequence('cleanDist', 'develop', ['_copyViews', '_copyDisplay', '_copyRenderJs', '_copyMainCss'], '_replaceHtml'));

gulp.task('cleanDist', function (done) {
    del([destDir]).then(function () {
        done();
    });
});

gulp.task('_copyViews', function () {
    return gulp.src(["views/**"])
        .pipe(gulp.dest(destDir + "/views"));
});
gulp.task('_copyDisplay', function () {
    return gulp.src(["display/**"])
        .pipe(gulp.dest(destDir + "/display"));
});

gulp.task('_copyRenderJs', function () {
    return gulp.src(["js/lib/render.js"])
		.pipe(rename('render_new.js'))
        .pipe(gulp.dest(destDir + "/mobile"));
});

gulp.task('_copyMainCss', function () {
    return gulp.src(["css/main.scss"])
		.pipe(rename('main_new.css' ))
        .pipe(gulp.dest(destDir + "/mobile"));
});

gulp.task('_replaceHtml', function () {
	var urlArgs = (new Date()).getTime();
    return gulp.src([destDir + "/views/mobile.html"])
        .pipe(replace(/myMeFlag/g, urlArgs))
		.pipe(gulp.dest(destDir + "/views"));
});








