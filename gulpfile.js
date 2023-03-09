/*global global, config, require */

////////////////////////////////////////////////////////////////////////////////
// GULPFILE.JS
////////////////////////////////////////////////////////////////////////////////

// TODO
//
// * make watch unbrokable (catch all errors without exiting)
//
// * gulp-tap (tools)
// * gulp-plumber
// * gulp-cache/remember?
// * gulp-useref
//
// ideas : https://github.com/osscafe/gulp-cheatsheet
// https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

global.config = {
  path: {
    src:    "src/",
    dist:   "./",
    tmp:    ".tmp/",
    css:    "css/",
    scss:   "scss/",
    es:     "es6/",
    js:     "js/",
    img:    "img/",
    fonts:  "fonts/"
  },

  filesJs: [
    "src/es6/main.js"
  ],

  serverport: 3000,
  openBrowser: false,
  openBrowsers: ["google chrome", "firefox"]
};

////////////////////////////////////////////////////////////////////////////////
// PATHS

config.pathTmp =        config.path.src + config.path.tmp;
config.pathCssTmp =     config.pathTmp + config.path.css;

// Build paths
config.pathEs =         [config.path.src + config.path.es + "**/*.js"];
config.pathScss =       [config.path.src + config.path.scss + "**/*.scss"];
config.pathSpritesSVG = [config.path.src + config.path.img + "sprites/*.svg"];
config.pathImages =     [config.path.src + config.path.img + "*.*", "!" + config.pathSpritesSVG];
config.pathHtml =       [config.path.src + "*.html"];

// DIST
config.pathJsDest =     config.path.dist + config.path.js;
config.pathCssDest =    config.path.dist + config.path.css;
config.pathFontsDest =  config.path.dist + config.path.fonts;
config.pathImagesDest = config.path.dist + config.path.img;

// CLEAN
config.pathClean =      [
  // config.path.dist, // Cannot clean dist/ as it's root directory
  config.path.dist + config.path.js,
  config.path.dist + config.path.css,
  config.path.dist + config.path.img,
  config.path.dist + config.path.fonts,

  config.pathTmp + config.path.js,
  config.pathTmp + config.path.css
];


////////////////////////////////////////////////////////////////////////////////
// MODULES

var gulp =      require("gulp"),
  plugins =     	require("gulp-load-plugins")(),
  browserSync = 	require("browser-sync"),
  reload =      	browserSync.reload,
  del =         	require("del"),
  // fs =     	    	require("node-fs"),
  vinylPaths =  	require("vinyl-paths"),
  autoprefixer = 	require("autoprefixer"),
  runSequence  = 	require("run-sequence");

require("gulp-stats")(gulp);


////////////////////////////////////////////////////////////////////////////////
// TASKS

////////////////////////////////////////////////////////////////////////////////
// CLEAN

gulp.task("clean", function () {
  return gulp.src(config.pathClean)
  .pipe(vinylPaths(del))
  .on("error", plugins.util.log);
});

////////////////////////////////////////////////////////////////////////////////
// COPY

gulp.task("copy", ["copy-fonts"]);

gulp.task("copy-fonts", function () {
  // return gulp.src([
  //   "foo"
  // ])
  // .pipe(gulp.dest(config.pathFontsDest))
  // .on("error", plugins.util.log);
});


////////////////////////////////////////////////////////////////////////////////
// IMAGES

gulp.task("images", function() {
  return gulp.src(config.pathImages)
  .pipe(plugins.newer(config.pathImagesDest))

  // prod
  .pipe(plugins.imagemin({
    progressive: true,  // jpeg
    interlaced: true,   // gif
    multipass: true     // svg
    // svgoPlugins: [{removeViewBox: false}],
    // use: [pngquant()]
  }))
  .pipe(gulp.dest(config.pathImagesDest))

  .pipe(reload({stream: true}))
  .on("error", plugins.util.log);
});

// SVG sprites

gulp.task("sprites", function() {
  return gulp.src(config.pathSpritesSVG)

  // prod
  .pipe(plugins.svgSprite({
    log: null,
    mode: {inline: true, symbol: true}
  }))
  .pipe(gulp.dest(config.path.src + config.path.img))
  .pipe(gulp.dest(config.pathImagesDest))

  .pipe(reload({stream: true}))
  .on("error", plugins.util.log);
});

gulp.task("sprites-reload", ["sprites"], reload);


////////////////////////////////////////////////////////////////////////////////
// MARKUP

gulp.task("markup", function() {
  return gulp.src(config.pathHtml)

  // prod
  .pipe(plugins.processhtml())
  .pipe(plugins.minifyHtml())
  .pipe(gulp.dest(config.path.dist))

  .pipe(reload({stream: true}))
  .on("error", plugins.util.log);
});


////////////////////////////////////////////////////////////////////////////////
// STYLES

gulp.task("styles", function() {
  return gulp.src([config.path.src + config.path.scss + "main.scss"])

  .pipe(plugins.sassLint({"config": "scsslint.yml"}))
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.sass({outputStyle: "expanded"}))
  .pipe(plugins.postcss([
    autoprefixer({
      browsers: ["last 2 version"]
    })
  ]))
  .pipe(plugins.sourcemaps.write({sourceRoot: "."}))
  .pipe(gulp.dest(config.pathTmp + config.path.css))
  .pipe(reload({stream: true}))

  // prod
  .pipe(plugins.minifyCss({
    keepSpecialComments: false,
    removeEmpty: true
  }))
  .pipe(plugins.rename({suffix: ".min"}))
  .pipe(gulp.dest(config.pathCssDest))
  .pipe(reload({stream: true}))
  .on("error", plugins.util.log);
});

////////////////////////////////////////////////////////////////////////////////
// SCRIPTS

gulp.task("scripts", function() {
  return gulp.src(config.filesJs)

  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
  //    .pipe(plugins.eslint.failAfterError())
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.babel({
    presets: ["es2015"],
    compact: false
  }))
  .pipe(plugins.concat("main.js"))
  .pipe(plugins.sourcemaps.write({sourceRoot: "."}))
  .pipe(gulp.dest(config.pathTmp + config.path.js))

  // prod
  .pipe(plugins.rename({suffix: ".min"}))
  .pipe(plugins.uglify({outSourceMaps: false}))
  .pipe(gulp.dest(config.pathJsDest))
  .pipe(reload({stream: true}))
  .on("error", plugins.util.log);
});


////////////////////////////////////////////////////////////////////////////////
// SERVE

gulp.task("serve", function() {
  browserSync({
    server: {
      baseDir: ["./" + config.path.src],
      // routes: {
      //   "/dev": "./" + config.path.src,
      //   "/prod": "./" + config.path.dist
      // },
      port: config.serverport
    },
    open: config.openBrowser,
    browser: config.openBrowsers
  });
});

////////////////////////////////////////////////////////////////////////////////
// WATCH

gulp.task("watch", function () {
  gulp.watch(config.pathEs, ["scripts"]);
  gulp.watch(config.pathScss, ["styles"]);
  gulp.watch(config.pathHtml, ["markup"]);
  gulp.watch(config.pathImages, ["images"]);
  gulp.watch(config.pathSpritesSVG, ["sprites-reload"]);
});


////////////////////////////////////////////////////////////////////////////////
// USER TASKS

gulp.task("compile", ["scripts", "styles", "markup"]);
gulp.task("graphics", ["images", "sprites"]);
gulp.task("swatch", ["serve", "watch"]);

gulp.task("build", function() { runSequence( "clean", ["compile", "graphics"] ); });
gulp.task("swild", function() { runSequence( "build", "swatch" ); });

gulp.task("default", ["swild"]);
