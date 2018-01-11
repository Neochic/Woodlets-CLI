var webpack = require('webpack');
var rxjs = require('rxjs');
var chalk = require('chalk');
var compiler = null;
var UglifyJSPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
var LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');

var getCompiler = function(configPath, production) {
    if(!compiler) {
        var config = require(configPath + '/webpack.config.js');

        if(typeof config === "function") {
            config = config({
                production: production
            });
        }
        if(production) {
            /*
             * mainly the same as --optimize-minimize
             * https://github.com/webpack/webpack/blob/bc1525dd84893ec7d4ab93d6d54443e5ad8ec240/bin/convert-argv.js#L456
             */
            config.plugins.push(new UglifyJSPlugin({
                sourceMap: config.devtool && (config.devtool.indexOf("sourcemap") >= 0 || config.devtool.indexOf("source-map") >= 0)
            }));

            config.plugins.push(new LoaderOptionsPlugin({
                minimize: true
            }));
        }

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

var compile = function(configPath, production) {
    var subject = new rxjs.Subject();
    getCompiler(configPath, production).run(function(err, stats) {
        console.log(chalk.blue("Start Webpack compilation..."));
        compileCallback(err, stats, subject);
    });
    return subject;
};

var watch = function(configPath, hint, production) {
    var subject = new rxjs.Subject();
    var firstBuild = true;

    console.log(chalk.blue("Start Webpack watcher..."));

    getCompiler(configPath, production).watch({}, function(err, stats) {
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
