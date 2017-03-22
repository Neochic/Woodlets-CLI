var program = require('commander');
var cli = require('../cli');

//fix command name
program._name = 'serve';
process.title = 'woodlets-cli serve';

cli.serve();
