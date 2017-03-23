var spawn = require('child_process').spawn;
var rxjs = require('rxjs');
var chalk = require('chalk');

var install = function() {
    var subject = new rxjs.ReplaySubject(1);

    console.log(chalk.blue('Installing NPM dependencies...'));
    var npm = process.platform.startsWith('win') ? spawn('cmd', ['/c', 'npm', 'install']) : spawn('npm', ['install']);
    npm.on('error', function(err) {
        console.log(chalk.red(err));
    });
    npm.on('exit', function(code) {
        if (code !== 0) {
            subject.error();
        } else {
            subject.next();
        }
    });
    npm.stdout.pipe(process.stdout);
    npm.stderr.pipe(process.stderr);

    return subject;
};


module.exports = {
    install: install
};
