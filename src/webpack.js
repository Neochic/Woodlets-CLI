var webpack = require('webpack');
var rxjs = require('rxjs');
var chalk = require('chalk');
var compiler = null;

var getCompiler = function(configPath) {
    if(!compiler) {
        var config = require(configPath + '/webpack.config.js');
        compiler = webpack(config);
    }

    return compiler;
};

var compileCallback = function(err, stats, subject) {
    console.log(stats.toString({
        chunks: false,
        colors: true
    }));

    if (err === null) {
        subject.next(stats);
        return;
    }

    subject.error(err);
};

var compile = function(configPath) {
    var subject = new rxjs.Subject();
    getCompiler(configPath).run(function(err, stats) {
        console.log(chalk.blue("Start Webpack compilation..."));
        compileCallback(err, stats, subject);
    });
    return subject;
};

var watch = function(configPath, hint) {
    var subject = new rxjs.Subject();
    var firstBuild = true;

    console.log(chalk.blue("Start Webpack watcher..."));

    getCompiler(configPath).watch({}, function(err, stats) {
        compileCallback(err, stats, subject);
        if (firstBuild) {
            if(hint) {
                console.log(hint);
            }
            console.log(chalk.blue("Webpack watcher started, you may start coding now..."));
            console.log("Use ctrl+c to stop watching.");

            firstBuild = false;
        };
    });
    return subject;
};

module.exports = {
    compile: compile,
    watch: watch
};
