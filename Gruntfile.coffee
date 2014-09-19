module.exports = (grunt) ->
  # Configuration
  grunt.initConfig
    # Package information
    pkg: grunt.file.readJSON 'package.json'

    # Coffeescript compilation
    coffee:
      compile:
        files:
          'lib/index.js': 'src/index.coffee',
          'spec/testSpec.js': 'src/testSpec.coffee'
          'demo/lib/worker01.js': 'demo/src/worker01.coffee'
          'demo/lib/provider01.js': 'demo/src/provider01.coffee'
          'demo/lib/worker02.js': 'demo/src/worker02.coffee'
          'demo/lib/provider02.js': 'demo/src/provider02.coffee'
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
        camel_case_classes:
          level: 'error'
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

    jshint:
      all: ['lib/*.js', 'spec/*.js', 'demo/lib/*.js']
      options:
        jshintrc: true

  # Load tasks from plugins
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-bumpx'
  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-contrib-jshint'

  # Task to run the test suite using jasmine-node.
  grunt.registerTask 'test', 'Runs Jasmine tests', ->
    exec = require('child_process').exec
    done = this.async()
    child = exec 'bash node_modules/.bin/jasmine-node --verbose spec',(error, stdout, stderr) ->
      console.log(stdout)
      console.log('Error running tests: ' + error) if error?
      done(!error?)

  # Task to tag a version in git
  grunt.registerTask 'git-tag', 'Tags a release in git', ->
    exec = require('child_process').exec
    done = this.async()
    releaseVersion = grunt.template.process('<%= pkg.version %>')

    child = exec 'git commit -am \'v#{releaseVersion}\' && git tag v#{releaseVersion}', (error, stdout, stderr) ->
      console.log('Error running git tag: ' + error) if error?
      done(!error?)

  # Release meta-task
  grunt.registerTask 'release', ['coffee', 'git-tag']

  # Default meta-task
  grunt.registerTask 'default', ['coffeelint', 'coffee']
