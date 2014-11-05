##Running the test suite

Use either `grunt test` or `npm test` to run the suite of tests using Mocha. The test cases reside in the `test` directory.

##Running grunt for development tasks

`grunt` runs coffeelint and then coffee.

`grunt coffeelint` runs coffeelint on all the .coffee source code in the src directory.

`grunt coffee` runs coffee on all the .coffee source code in the src directory, converting it to .js code in the
corresponding lib directory.

`grunt jshint` runs jshint on all the .js code except one in the demo/lib/helpers directory. Note that jshint may
have a lot of complaints about the generated .js code, but is useful to spot potential problems.

`grunt clean` runs a script that removes vim backup files (i.e., files ending with '~' and .js files in the test directory).

`grunt test` runs the suite of tests using Mocha. It looks for .coffee files in the test directory.

`grunt bump` bumps the patch number up in the package.json file.

`grunt git-tag` commits the latest staged code changes and tags the code with the version obtained from the package.json file.

`grunt release` runs coffee on all the .coffee source code in the src directory, converting it to .js code, and
then runs the git-tag task to commit the latest staged code changes and tag the code with the version obtained from the
package.json file.

`grunt compile-test` runs coffee on the test .coffee code. This is only for debugging of test cases when you need to see the generated javascript code.

