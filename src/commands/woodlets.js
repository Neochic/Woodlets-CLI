#!/usr/bin/env node

var program = require('commander');
var pjson = require('../../package.json');

process.title = 'woodlets-cli';

program
  .version(pjson.version)
  .command('init', 'Initilizes Woodlets in current directory').alias('i')
  .command('create', 'Creates directory with theme name and initilizes Woodlets in it').alias('c')
  .command('build', 'Compiles JS and CSS with Webpack').alias('b')
  .command('watch', 'Builds and watches for changes to rebuild').alias('w')
  .command('serve', 'Like serve but starts docker containers first').alias('s');


program.parse(process.argv);

//prevent main process from exiting to early for ctrl+c
process.on('SIGINT', function () {});

if (!program.args.length) {
    program.outputHelp();
} else {
    var commands = program.commands.map(function(val) { return val._name });
    if(commands.indexOf(program.args[0]) < 0) {
        program.outputHelp();
    }
}
