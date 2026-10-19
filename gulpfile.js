/**
 * Task 1 build, with Gulp.
 *
 *   npm run build   lint the Sass, then build the CSS and the JavaScript: the version to hand in
 *   npm run watch   build both with source maps, then rebuild whichever changes on every save
 *   npm run lint    lint the Sass only
 *
 * Sass:       scss/styles.scss -> css/styles.css
 * JavaScript: js/src/main.js   -> js/build/main.min.js
 *
 * The JavaScript step matches the Moodle theme's amd/src -> amd/build build: Babel compiles modern syntax down for
 * the browsers listed in package.json's "browserslist", then Terser minifies it. The built files are kept in the
 * repository, so index.html still opens with a double click without a build.
 */
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import babel from 'gulp-babel';
import terser from 'gulp-terser';
import rename from 'gulp-rename';
import stylelint from 'stylelint';
import {Transform} from 'node:stream';

const {src, dest, series, parallel, watch} = gulp;
const sass = gulpSass(dartSass);

const paths = {
    scss: 'scss/**/*.scss',
    scssEntry: 'scss/styles.scss',
    css: 'css',
    js: 'js/src/**/*.js',
    jsOut: 'js/build',
};

// Stylelint, run through its own Node API. In watch mode a lint error is reported but doesn't stop the build.
const lintStyles = (failOnError) => async function lint() {
    const result = await stylelint.lint({files: paths.scss, formatter: 'string'});
    if (result.report.trim()) {
        console.log(result.report);
    }
    if (result.errored && failOnError) {
        throw new Error('Stylelint found problems.');
    }
};

// Readable CSS, as reviewers read it. Source maps only while developing.
const buildStyles = (sourcemaps) => function styles() {
    return src(paths.scssEntry, {sourcemaps})
        .pipe(sass({style: 'expanded'}).on('error', sass.logError))
        .pipe(dest(paths.css, {sourcemaps: sourcemaps ? '.' : false}));
};

// The map is written next to the minified file in js/build, so point it back at js/src.
const pointMapAtSource = () => new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
        if (file.sourceMap) {
            file.sourceMap.sourceRoot = '../src';
        }
        callback(null, file);
    },
});

// Babel, then Terser. The source map is carried through both steps, so dev tools show js/src/main.js.
const buildScripts = (sourcemaps) => function scripts() {
    return src(paths.js, {sourcemaps})
        .pipe(babel({presets: [['@babel/preset-env', {modules: false}]]}))
        .pipe(terser({compress: {passes: 2}, mangle: true}))
        .pipe(rename({suffix: '.min'}))
        .pipe(pointMapAtSource())
        .pipe(dest(paths.jsOut, {sourcemaps: '.'}));
};

export const lint = lintStyles(true);

export const build = series(lintStyles(true), parallel(buildStyles(false), buildScripts(true)));

const dev = parallel(buildStyles(true), buildScripts(true));

const watchFiles = () => {
    // Compile first, so the page updates even when the lint finds a problem; lint errors still show.
    watch(paths.scss, series(buildStyles(true), lintStyles(false)));
    watch(paths.js, buildScripts(true));
};

// Builds everything once, with source maps, then rebuilds whatever changes.
const watchTask = series(dev, watchFiles);
export {watchTask as watch};

export default build;
