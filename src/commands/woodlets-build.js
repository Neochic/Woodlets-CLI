var program = require('commander');
var cli = require('../cli');

//fix command name
program._name = 'build';
process.title = 'woodlets-cli build';

cli.build();
