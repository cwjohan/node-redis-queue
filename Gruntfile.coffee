exec = require('child_process').exec

module.exports = (grunt) ->
  # Configuration
  grunt.initConfig
    # Package information
    pkg: grunt.file.readJSON 'package.json'

    # Coffeescript compilation
    coffee:
      compile:
        files: [
          {expand: true, cwd: 'src', src: '*.coffee', dest: 'lib', ext: '.js'}
          {expand: true, cwd: 'demo/src', src: '*.coffee', dest: 'demo/lib', ext: '.js'}
        ]
      options:
        bare: true

    # Version bumping
    bump:
      options: part: 'patch'
      files: ['package.json']

    coffeelint:
      app: ['src/*.coffee', 'demo/src/*.coffee']
      options:
        no_trailing_whitespace:
          level: 'error'
        arrow_spacing:
          level: 'error'
        indentation:
          level: 'error'
          value: 2
        cyclomatic_complexity:
          level: 'warn'
          value: 11
        space_operators:
          level: 'error'
        camelcase:
          level: 'warn'
        camel_case_classes:
          level: 'warn'
        max_line_length:
          level: 'warn'
          value: 120
        missing_fat_arrows:
          level: 'warn'
        no_empty_functions:
          level: 'warn'
        no_implicit_braces:
          level: 'error'
        no_unnecessary_double_quotes:
          level: 'error'
        prefer_english_operator:
          level: 'warn'

    mochaTest:
      test:
        options:
          reporter: 'spec'
        src: ['test/**/*.coffee']

    jshint:
      all: ['lib/*.js', 'spec/*.js', 'demo/lib/*.js']
      options:
        jshintrc: true

  # Load tasks from plugins
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-bumpx'
  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-mocha-test'
  grunt.loadNpmTasks 'grunt-contrib-jshint'

  # Task to tag a version in git
  grunt.registerTask 'git-tag', 'Tags a release in git', ->
    done = this.async()
    releaseVersion = grunt.template.process("<%= pkg.version %>")

    exec "git commit -am 'v#{releaseVersion}' && git tag v#{releaseVersion}", (error, stdout, stderr) ->
      console.log 'Error running git tag: ' + error if error?
      done !error?

  # Task to remove vim backup files
  grunt.registerTask 'clean', 'Runs cleaning script', ->
    done = this.async()
    exec 'bash ./script/clean', (error, stdout, stderr) ->
      console.log stdout
      console.log 'Error: ' + error if error?
      done !error?

  # Task to compile test coffee files for debugging purposes only
  grunt.registerTask 'compile-test', 'Runs cleaning script', ->
    done = this.async()
    exec 'bash node_modules/.bin/coffee -c -o test test', (error, stdout, stderr) ->
      console.log stdout
      console.log 'Error: ' + error if error?
      done !error?

  # Test meta-task
  grunt.registerTask 'test', 'mochaTest'

  # Release meta-task
  grunt.registerTask 'release', ['coffee', 'git-tag']

  # Default meta-task
  grunt.registerTask 'default', ['coffeelint', 'coffee']
