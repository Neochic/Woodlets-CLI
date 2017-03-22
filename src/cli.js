var program = require('commander');
var inquirer = require('inquirer');
var chalk = require('chalk');
var path = require('path');
var rxjs = require('rxjs');
var fs = require('fs');
var Composer = require('./composer');
var Seed = require('./seed');
var WordPress = require('./wordpress');
var Npm = require('./npm');
var Webpack = require('./webpack');
var ThemeLink = require('./theme-link');
var FileEditor = require('./file-editor');
var Docker = require('./docker');
var Config = require('./config');

var validateAllowedChars = function (value) {
    return value.match(/^[A-Za-z0-9\-]+$/i);
};

var getDefaultName = function (create) {
    if (create) {
        return null;
    }

    var name = path.basename(process.cwd());
    if (!validateAllowedChars(name)) {
        return null;
    }

    return name;
};

var getName = function () {
    var subject = new rxjs.ReplaySubject(1);

    if (program.args.length < 1) {
        inquirer.prompt({
            type: 'input',
            name: 'name',
            message: 'Name of the theme',
            validate: function (value) {
                if (value.trim() === "") {
                    return "Please provide a theme name.";
                }

                if (!validateAllowedChars(value)) {
                    return `Only alphanumeric characters and '-' are allowed.`;
                }

                return true;
            },
            default: getDefaultName(create)
        }).then(function (answers) {
            subject.next(answers['name']);
        });
    } else {
        subject.next(program.args[0]);
    }

    return subject;
};

var installDependencies = function () {
    return Seed.download()
        .flatMap(function () {
            return WordPress.download();
        })
        .flatMap(function () {
            return Composer.install();
        })
        .flatMap(function () {
            return Npm.install();
        });
};

var createThemeDirectory = function (name) {
    var path = process.cwd() + '/' + name;
    if (fs.existsSync(path)) {
        console.log(chalk.red(`Directory '${name}' does already exist.`));
        process.exit(1);
    }
    fs.mkdirSync(path);
    return path;
};

var wpDebugMode = function () {
    var subject = new rxjs.ReplaySubject(1);

    inquirer.prompt({
        type: 'confirm',
        name: 'debug',
        message: 'Set "WP_DEBUG" to true?',
        default: true
    }).then(function (answers) {
        if (answers['debug']) {
            Config.setDebugTrue().subscribe(function () {
                subject.next();
            });
            return;
        }
        subject.next();
    });

    return subject;
};

var waitForWPConfig = function () {
    var subject = new rxjs.ReplaySubject(1);
    console.log(chalk.blue('Waiting for "public/wp-config.php" to be present...'));
    var wait = function () {
        if (fs.existsSync('public/wp-config.php')) {
            subject.next();
            return;
        }
        setTimeout(wait, 500);
    };
    wait();

    return subject;
};

var setupGuidance = function () {
    var dockerPort = null;
    return Docker.isDockerAvailable().flatMap(function (useDocker) {
        if (useDocker) {
            return Docker.start().flatMap(function () {
                return Docker.getPort();
            }).map(function (port) {
                dockerPort = port;
            });
        }

        var subject = new rxjs.ReplaySubject(1);
        subject.next();
        return subject;
    }).flatMap(function () {
        var wpConfigSubject = waitForWPConfig();
        if (dockerPort) {
            var url = `http://localhost:${dockerPort}`;
            console.log(chalk.cyan(`Open ${url} in your browser and run through WordPress setup.`));
            console.log(chalk.cyan(`Use "admin" for DB username and password and "mysql" as host.`));
            return wpConfigSubject;
        }

        var documentRoot = path.resolve(process.cwd(), 'public');
        console.log(chalk.yellow("Warning: It seems as you don't have docker-compose installed. You've to configure an http server manually."));
        console.log(chalk.cyan(`Please configure "${documentRoot}" as document root of your http server.`));
        console.log(chalk.cyan(`Then open the page in your browser and run through WordPress setup.`));

        return wpConfigSubject;
    }).map(function () {
        console.log(chalk.blue(`"WP_CONFIG" found.`));
        return dockerPort;
    });
};

var init = function (create) {
    var themeName = null;
    var dockerPort = null;

    program
        .arguments('[name]')
        .parse(process.argv);

    getName().flatMap(function (name) {
        themeName = name;
        if (create) {
             process.chdir(createThemeDirectory(name));
        }

        return installDependencies();
    }).flatMap(function () {
        var config = Config.getProjectConfig();
        config.name = themeName;
        Config.setProjectConfig(config);
        return ThemeLink.link(process.cwd() + '/src', process.cwd() + '/public/wp-content/themes/' + themeName);
    }).flatMap(function () {
        return FileEditor.replace('src/style.less', /^(\s*Theme Name:\s*).*$/gm, '$1' + themeName);
    }).flatMap(function () {
        return Webpack.compile(process.cwd());
    }).flatMap(function () {
        return setupGuidance();
    }).flatMap(function (port) {
        dockerPort = port;
        return wpDebugMode();
    }).subscribe(function () {
        var hint = chalk.blue(`Woodlets theme is created successfully.\n`);
        hint += chalk.cyan(`Please activate your new theme in the WordPress Backend.\n`);
        hint += chalk.cyan(`Notice: Don't forget to install the Woodlets plugin via the admin notice.\n`);
        if (dockerPort) {
            hint += chalk.cyan(`Next time you can start developing your project with "woodlets serve" command in the project directory.`);
        } else {
            hint += chalk.cyan(`Next time you can start developing your project with "woodlets watch" command in the project directory.`);
        }
        Webpack.watch(process.cwd(), hint);
    }, function (error) {
        console.log(chalk.red(error));
        process.exit(1);
    });
};

var create = function () {
    init(true);
};

var watch = function () {
    return Webpack.watch(process.cwd());
};

var serve = function () {
    Docker.isDockerAvailable().flatMap(function (useDocker) {
        if (useDocker) {
            return Docker.start().flatMap(function () {
                return watch();
            });
        }

        console.log(chalk.yellow(`Warning: docker-compose is not available. Falling back to "woodlets watch".`));
        return watch();
    }).subscribe(void 0, function (error) {
        console.log(chalk.red(error));
        process.exit(1);
    });
};

var build = function () {
    program
        .option('-w, --watch', 'Watches for changes to rebuild')
        .parse(process.argv);

    if (program.watch) {
        watch();
        return;
    }
    Webpack.compile(process.cwd());
};

module.exports = {
    init: init,
    create: create,
    build: build,
    watch: watch,
    serve: serve
};
