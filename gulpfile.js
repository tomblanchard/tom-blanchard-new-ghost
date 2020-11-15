var path = require('path');
var { series, watch, src, dest } = require('gulp');
var liquid = require('@tuanpham-dev/gulp-liquidjs');
var data = require('gulp-data');
var sass = require('gulp-sass');
var purgecss = require('gulp-purgecss');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');

sass.compiler = require('node-sass');

var server = browserSync.create();

function build_liquid() {
  return src('./src/templates/*.liquid')
    .pipe(data(function(file) {
      return {
        template: path.basename(file.path).split('.')[0]
      };
    }))
    .pipe(liquid({
      engine: {
        root: [
          './src/assets',
          './src/layout',
          './src/snippets',
          './src/templates'
        ],
        extname: '.liquid',
        strictFilters: true
      },
      filters: {
        json: (str) => JSON.stringify(str, null, 2),
        sort: (str) => [str],
        handle: (str) => str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-')
      }
    }))
    .pipe(dest('./dist'));
};

function build_sass() {
  return src('./src/assets/*.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(purgecss({
      content: ['./src/**/*.liquid']
    }))
    .pipe(rename('theme.min.css'))
    .pipe(dest('./dist/assets'))
    .pipe(server.stream());
};

function reload(done) {
  server.reload();
  done();
};

function serve(done) {
  server.init({
    server: {
      baseDir: './dist'
    },
    open: 'external'
  });
  done();
};

function copy_assets() {
  return src('./src/assets/*')
    .pipe(dest('./dist/assets'));
};

function watch_all() {
  watch('./src/*/**.liquid', series(build_liquid, reload));
  watch(['./src/assets/*.scss', './src/*/**.liquid'], build_sass);
  watch('./src/assets/*', copy_assets);
};

exports.default = series(build_liquid, build_sass, serve, copy_assets, watch_all);
