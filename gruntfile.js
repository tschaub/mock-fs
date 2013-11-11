

/**
 * @param {Object} grunt Grunt.
 */
module.exports = function(grunt) {

  var gruntfileSrc = 'gruntfile.js';
  var testSrc = 'test/**/*.spec.js';
  var libSrc = 'lib/**/*.js';

  grunt.initConfig({

    cafemocha: {
      options: {
        reporter: 'spec'
      },
      all: {
        src: testSrc
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: gruntfileSrc
      },
      tests: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: testSrc
      },
      lib: {
        src: libSrc
      }
    },

    watch: {
      tests: {
        files: testSrc,
        tasks: ['newer:cafemocha']
      },
      lib: {
        files: libSrc,
        tasks: ['cafemocha']
      },
      allJs: {
        files: [gruntfileSrc, testSrc, libSrc],
        tasks: ['newer:jshint']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-cafe-mocha');
  grunt.loadNpmTasks('grunt-newer');

  grunt.registerTask('test', ['newer:jshint', 'cafemocha']);
  grunt.registerTask('start', ['test', 'watch']);

  grunt.registerTask('default', 'test');

};
