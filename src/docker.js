var fs = require('fs');
var rxjs = require('rxjs');
var spawn = require('child_process').spawn;
var FileEditor = require('./file-editor');
var chalk = require('chalk');
var inquirer = require('inquirer');
var Config = require('./config');

var envFile = '.env';

var createEnv = function() {
    if (!fs.existsSync(envFile)) {
        fs.closeSync(fs.openSync(envFile, 'a'));
    }
};

var getPort = function() {
    createEnv();
    return FileEditor.find(envFile, /^WOODLETS_EXPOSE_PORT=(\d*)$/gm).map(function(value) {
        if(value) {
           return value[1];
        }
        return null;
    });
};

var updateThemeName = function() {
    createEnv();
    var config = Config.getProjectConfig();
    if (!config.name) {
        console.log(chalk.red('Woodlets configuration missing or invalid. Name is not set.'));
        process.exit(1);
    }

    return FileEditor
        .replace(envFile, /^(WOODLETS_NAME=)\d*$/gm, '$1' + config.name)
        .flatMap(function(matches) {
            if(matches > 0) {
                return rxjs.Observable.of(matches);
            }
            return FileEditor.insert(envFile, 0, 'WOODLETS_NAME=' + config.name);
        });
}

var initConfig = function() {
    var subject = new rxjs.Subject();

    updateThemeName().flatMap(function() {
        return getPort();
    }).subscribe(function(port) {
        if(port) {
            subject.next();
            return;
        }

        inquirer.prompt({
            type: 'input',
            name: 'port',
            message: 'Port to run on',
            validate: function (value) {
                if (value.trim() === "") {
                    return "Please provide a port number.";
                }

                if (!value.match(/^[0-9]+$/i)) {
                    return `Only numeric ports are allowed.`;
                }

                if (parseInt(value) <= 1024 || parseInt(value) > 65535) {
                    return `Not in the valid port range (1025-65535)`;
                }

                return true;
            },
            default: "4200"
        }).then(function (answers) {
            setPort(answers['port']).subscribe(function() {
                subject.next();
            });
        });
    });

    return subject;
};

var setPort = function(port) {
    createEnv();
    return FileEditor
        .replace(envFile, /^(WOODLETS_EXPOSE_PORT=)\d*$/gm, '$1' + port)
        .flatMap(function(matches) {
            if(matches > 0) {
                return rxjs.Observable.of(matches);
            }
            return FileEditor.insert(envFile, 0, 'WOODLETS_EXPOSE_PORT=' + port);
        });
};

var isDockerAvailable = function() {
    var subject = new rxjs.Subject();
    var dockerCompose = spawn('docker-compose', ['--version']);
    dockerCompose.on('error', function() {
        subject.next(false);
    });

    dockerCompose.on('exit', function(code) {
        if (code !== 0) {
            subject.next(false);
        } else {
            subject.next(true);
        }
    });

    return subject;
};

var start = function() {
    var subject = new rxjs.Subject();
    console.log(chalk.blue("Starting docker containers..."));

    initConfig().subscribe(function() {
        var dockerCompose = spawn('docker-compose', ['up', '-d']);
        dockerCompose.on('error', function(err) {
            subject.error(err);
        });

        dockerCompose.on('exit', function(code) {
            if (code !== 0) {
                subject.error();
            } else {
                subject.next(true);
            }
        });

        dockerCompose.stdout.pipe(process.stdout);
        dockerCompose.stderr.pipe(process.stderr);

        process.stdin.resume();
        process.on('SIGINT', function () {
            console.log("");
            stop().subscribe(function() {
                process.exit(130);
            });
        });
    });

    return subject;
};

var stop = function() {
    var subject = new rxjs.Subject();

    console.log(chalk.blue("Shutting down docker containers..."));

    var dockerCompose = spawn('docker-compose', ['down']);
    dockerCompose.on('error', function(err) {
        subject.error(err);
    });

    dockerCompose.on('exit', function(code) {
        if (code !== 0) {
            subject.error();
        } else {
            subject.next(true);
        }
    });

    dockerCompose.stdout.pipe(process.stdout);
    dockerCompose.stderr.pipe(process.stderr);

    return subject;
};

module.exports = {
    isDockerAvailable: isDockerAvailable,
    getPort: getPort,
    start: start,
    stop: stop
};
