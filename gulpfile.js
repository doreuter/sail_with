/* File: gulpfile.js */

const gulp = require('gulp'),
      sass = require('gulp-sass'),
      copy = require('gulp-contrib-copy'),
      mocha = require('gulp-mocha'),
      babel = require('gulp-babel'),
      concat = require('gulp-concat'),
      pleeease = require('gulp-pleeease'),
      sourcemaps = require('gulp-sourcemaps'),
      ngAnnotate = require('gulp-ng-annotate');

/*****************
 *  GULP CONFIG  *
 *****************/

const SassOptions = {
  sourcemap: true,
  style: 'compressed'
};

// set minifier to false to keep sass sourcemaps support
const PleeeaseOptions = {
  optimizers: {
    minifier: false,
    autoprefixer: {
      browsers: ['ie 9']
    }
  },
  sass: true,
};

/****************
 *  GULP TASKS  *
 ****************/

// gulp main task
gulp.task('default', ['dev', 'watch']);

// gulp css
gulp.task('awesome-css', function() {
  return gulp.src('./src/scss/**/*.scss', { base: '.' })
    .pipe(sass(SassOptions))
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.min.css'))
    .pipe(pleeease(PleeeaseOptions))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'));
});

// gulp babel
gulp.task('awesome-js', function() {
  return gulp.src('./src/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('bundle.js'))
    .pipe(ngAnnotate())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('bower-js', function() {
  return gulp.src([
    //'./bower_components/jquery/dist/jquery.js',
    './bower_components/angular/angular.js',
    './bower_components/angular-sanitize/angular-sanitize.js',
    './bower_components/angular-local-storage/dist/angular-local-storage.js',
    './bower_components/angular-cookies/angular-cookies.js',
    './bower_components/angular-jwt/dist/angular-jwt.js',
    './bower_components/angular-loading-bar/build/loading-bar.js',
    './bower_components/angular-ui-router/release/angular-ui-router.js',
    './bower_components/angular-notify/dist/angular-notify.js',
    //'./bower_components/foundation-sites/dist/foundation.js',
    //'./bower_components/what-input/what-input.js',
    './bower_components/angular-foundation-6/dist/angular-foundation.js'
  ]).pipe(sourcemaps.init())
    .pipe(concat('bundle.bower_components.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('bower-css', function() {
  return gulp.src([
    './bower_components/angular-loading-bar/build/loading-bar.css',
    './bower_components/foundation-sites/dist/foundation.css',
    './bower_components/angular-notify/dist/angular-notify.css',
    './bower_components/font-awesome/css/font-awesome.css'
  ]).pipe(sourcemaps.init())
    .pipe(concat('bundle.bower_components.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'));
});

// gulp mocha
gulp.task('mocha', function() {
  return gulp.src([
    'test/test.server.js',
    'test/test.database.js'
  ], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    }));
});

gulp.task('copy', function() {
    gulp.src([
      'src/**/*.html',
      'src/**/*.png',
      'src/favicon.ico',
      'src/**/*.svg',
      'src/**/*.woff',
      'src/**/*.woff2',
      'src/**/*.ttf',
      'src/**/*.css',
        'src/**/*.js'
    ]).pipe(copy())
      .pipe(gulp.dest('public/'));
});



gulp.task('test', ['mocha']);

gulp.task('dev', ['copy', 'bower-css', 'bower-js', 'awesome-js', 'awesome-css']);

gulp.task('production', []);

/*******************
 *  GULP WATCHERS  *
 *******************/

gulp.task('watch', function() {
  gulp.watch('src/scss/**/*.scss', ['awesome-css']);
  gulp.watch('src/js/**/*.js', ['awesome-js']);
  gulp.watch('src/**/*.html', ['copy']);
});
