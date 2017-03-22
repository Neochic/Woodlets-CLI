var AdmZip = require('adm-zip');
var request = require('request');
var chalk = require('chalk');
var rxjs = require('rxjs');
var fs = require('fs');
var ProgressBar = require('progress');

var download = function(url, title, check, target, entry) {
    var subject = new rxjs.ReplaySubject(1);
    if (fs.existsSync(check)) {
        subject.error('Target directory is not empty.');
        return subject;
    }

    console.log(chalk.blue('Downloading '+title+'...'));
    var req = request({url: url, encoding: null}, function(err, resp, body) {
        if(err) {
            subject.error(err);
            return;
        }
        var zip = new AdmZip(body);
        console.log(chalk.blue('Extracting '+title+'...'));
        zip.extractEntryTo(entry, target, false);
        subject.next();
    });



    req.on('response', function (res) {
        var len = parseInt(res.headers['content-length'], 10);
        if (isNaN(len)) {
            //progress bar won't work
            return;
        }
        var start = new Date();
        var current = 0;
        var bar = new ProgressBar('[:bar] :woodletsRate KB/s - :woodletsCurrent MB of :woodletsTotal MB, :etas remaining', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: len
        });

        res.on('data', function (chunk) {
            current += chunk.length;
            bar.tick(
                chunk.length, {
                    'woodletsRate': Math.round((current / 1024) / ((new Date() - start) / 1000)),
                    'woodletsCurrent': (current / 1024 / 1024).toFixed(2),
                    'woodletsTotal': (len / 1024 / 1024).toFixed(2)
                }
            );
        });
    });

    return subject;
};

module.exports = {
    download: download
};
