var program = require('commander');
var cli = require('../cli');

//fix command name
program._name = 'init';
process.title = 'woodlets-cli init';

cli.init();
