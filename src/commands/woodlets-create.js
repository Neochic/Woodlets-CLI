var program = require('commander');
var cli = require('../cli');

//fix command name
program._name = 'create';
process.title = 'woodlets-cli create';

cli.create();
