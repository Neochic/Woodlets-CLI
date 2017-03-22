var request = require('request');
var chalk = require('chalk');
var spawn = require('child_process').spawn;
var fs = require('fs');
var rxjs = require('rxjs');


var download = function() {
    var subject = new rxjs.ReplaySubject(1);
    if(fs.existsSync('composer.phar')) {
        subject.next();
        return subject;
    }

    console.log(chalk.blue('Downloading Composer...'));

    request({url: "https://getcomposer.org/installer", encoding: null}, function(err, resp, body) {
        if (err) throw err;

        var php = spawn('php');
        php.on('error', function(err) {
            if(err.code === 'ENOENT') {
                subject.error('PHP doesn\'t seem to be installed.');
                return;
            }
            subject.error(err);
        });
        php.on('exit', function(code) {
            if (code !== 0) {
                subject.error();
            } else {
                subject.next();
            }
        });
        php.stdout.pipe(process.stdout);
        php.stderr.pipe(process.stderr);
        php.stdin.setEncoding('utf-8');
        php.stdin.write(body);
        php.stdin.end();
    });

    return subject;
};

var install = function() {
    var subject = new rxjs.ReplaySubject(1);
    download().subscribe(function() {
        console.log(chalk.blue('Installing Composer dependencies...'));
        var composer = spawn('php', ['composer.phar', 'install']);
        composer.on('error', function(err) {
            subject.error(err);
        });
        composer.on('exit', function(code) {
            if (code !== 0) {
                subject.error();
            } else {
                subject.next();
            }
        });
        composer.stdout.pipe(process.stdout);
        composer.stderr.pipe(process.stderr);
    }, function() {
        subject.error();
    });

    return subject;
};

module.exports = {
    download: download,
    install: install
};
