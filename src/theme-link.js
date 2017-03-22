var rxjs = require('rxjs');
var fs = require('fs');
var path = require('path');

var link = function(target, linkName) {
    target = path.resolve(target);
    linkName = path.resolve(linkName);
    var subject = new rxjs.ReplaySubject(1);

    if (process.platform.startsWith('win')) {
        //for windows use powershell for UAC prompt
        const exec = require('child_process').exec;

        exec('powershell "start-process powershell -ArgumentList \'cmd /c mklink /d ' + linkName + ' ' + target + '\' -verb runas"', function (error, stdout, stderr) {
            if (error) {
                console.error(stderr);
                subject.error(error);
                return;
            }
            console.log('stdout: ' + stdout);
            subject.next();
        });
    } else {
        //relative link to make project movable on filesystem
        // without recreation of the link
        target = path.relative(path.dirname(linkName), target);
        fs.symlink(target, linkName, 'dir', function (error) {
            if (error) {
                console.log(error);
                subject.error(error);
                return;
            }
            subject.next();
        });
    }

    return subject;
}

module.exports = {
    link: link
};
