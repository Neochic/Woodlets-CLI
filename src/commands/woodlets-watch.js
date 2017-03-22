var program = require('commander');
var cli = require('../cli');

//fix command name
program._name = 'watch';
process.title = 'woodlets-cli watch';

cli.watch();
