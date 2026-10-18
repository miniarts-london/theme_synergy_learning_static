/**
 * Task 1 build: Sass in scss/ is linted and compiled to css/styles.css.
 *
 *   npm run build   lint, then compile (no source map): the version to hand in
 *   npm run watch   compile with a source map, then recompile on every save
 *   npm run lint    lint only
 *
 * css/styles.css is kept in the repository, so index.html still opens with a double click without a build.
 */
module.exports = (grunt) => {
    const sass = require('sass');

    grunt.initConfig({
        stylelint: {
            src: ['scss/**/*.scss'],
        },

        sass: {
            options: {
                implementation: sass,
                api: 'modern',
                style: 'expanded',
            },
            // Readable output, as the CSS is read by reviewers.
            dist: {
                options: {sourceMap: false},
                files: {'css/styles.css': 'scss/styles.scss'},
            },
            // Same output plus a source map, so browser dev tools point at the .scss partial.
            dev: {
                options: {sourceMap: true},
                files: {'css/styles.css': 'scss/styles.scss'},
            },
        },

        watch: {
            options: {spawn: false},
            styles: {
                files: ['scss/**/*.scss'],
                // Compile first, so the page updates even when the lint finds a problem; lint errors still show.
                tasks: ['sass:dev', 'stylelint'],
            },
        },
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-stylelint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('dev', ['sass:dev']);
    grunt.registerTask('default', ['stylelint', 'sass:dist']);
};
