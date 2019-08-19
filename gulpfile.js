// Gulp Dependencies
var gulp = require('gulp');
var rename = require('gulp-rename');

// Build Dependencies
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');

// Style Dependencies
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var sass = require('gulp-sass');

// Development Dependencies
var jshint = require('gulp-jshint');

// Browser sync
var browserSync = require('browser-sync').create();

// Nodemon
var nodemon = require('gulp-nodemon');

// Conf
const resourcePath = './resources';
const resourceScriptsPath = './resources/scripts';

const stylesSrcPath = './resources/styles';
const stylesDistPath = './public/styles';


//
// Javascripts
//
  gulp.task('scripts-lint', function() {
      return gulp.src(resourceScriptsPath + '/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
  });

  gulp.task('scripts', ['scripts-lint'], function() {
      return gulp.src(resourceScriptsPath + '/index.js')
        .pipe(browserify({
          insertGlobals: true
        }))
        .pipe(rename('index.js'))
        .pipe(gulp.dest('./public/scripts'));
  });
  
  gulp.task('scripts-browsersync', ['scripts'], function(done) {
    setTimeout(function() {
      browserSync.reload();
    }, 150);
    done();
  });

  gulp.task('scripts-min', ['scripts'], function() {
    return gulp.src('./public/scripts/index.js')
      .pipe(uglify())
      .pipe(rename('index.min.js'))
      .pipe(gulp.dest('./public/scripts'));
  });

//
// Styles
//
  gulp.task('styles', function() {
    return gulp.src(stylesSrcPath + '/styles.scss')
      .pipe(sass())
      .pipe(autoprefixer({ cascade: true }))
      .pipe(rename('styles.css'))
      .pipe(gulp.dest(stylesDistPath))
      .pipe(browserSync.stream());
  });

  gulp.task('styles-min', ['styles'], function() {
    return gulp.src(stylesDistPath + '/styles.css')
      .pipe(minifyCSS())
      .pipe(rename('styles.min.css'))
      .pipe(gulp.dest(stylesDistPath));
  });

//
// Tasks for running
// 
  gulp.task('watch', function() {
      gulp.watch(resourceScriptsPath + '/**/*.js', ['scripts']);
      gulp.watch(stylesSrcPath + '/**/*.scss', ['styles']);
  });

  // Static Server + watching scss/html files
  gulp.task('dev', function() {
    // Nodemon stream
    var browserSyncStarted = false;

    var stream = nodemon({
      script: 'server.js',
      nodeArgs : [
        '--inspect=0.0.0.0:5858'
      ],
      env: {
        'NODE_ENV': 'development',
        'DEBUG': 'app'
      }
    })
    .on('start', function() {

      if(browserSyncStarted) {
        setTimeout(function() {
          browserSync.reload();
        }, 4000);
      } else {

        setTimeout(function() {

          browserSync.init({
            proxy: "localhost:3000",
            open : false,
            port : 3001,
          });
          
          browserSyncStarted = true;

        }, 500);

      }
      
    })

    gulp.watch(stylesSrcPath + '/**/*.scss', ['styles']);
    gulp.watch(resourceScriptsPath + '/**/*.js', ['scripts']);
    gulp.watch('./public/scripts/index.js', function() {
      browserSync.reload();
    });
    gulp.watch('./app/views/**/*', function() {
      browserSync.reload();
    });

  });

  gulp.task('build', ['scripts-min', 'styles-min']);