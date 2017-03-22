var fs = require('fs');
var chalk = require('chalk');
var FileEditor = require('./file-editor');

var userConfigFile = require('os').homedir()+'/.neochic-woodlets-cli';
var projectConfigFile = 'woodlets-cli.json';

var getUserConfig = function() {
    if (!fs.existsSync(userConfigFile)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(userConfigFile, "utf8"));
};

var setUserConfig = function(config) {
    fs.writeFileSync(userConfigFile, JSON.stringify(config, null, 4));
};

var projectConfigAvailable = function() {
    return fs.existsSync(projectConfigFile);
};

var getProjectConfig = function() {
    if (!projectConfigAvailable()) {
        return {};
    }
    return JSON.parse(fs.readFileSync(projectConfigFile, "utf8"));
};

var setProjectConfig = function(config) {
    fs.writeFileSync(projectConfigFile, JSON.stringify(config, null, 4));
};

var setDebugTrue = function() {
    return FileEditor.replace(
        'public/wp-config.php',
        /^\s*define\('WP_DEBUG',\s*((true)|(false))\s*\);\s*$/gm,
        `define('WP_DEBUG', true);`
    ).map(function(matches) {
        if(matches === 0) {
            console.log(chalk.yellow('Warning: Setting debug in "public/wp-config.php" to true failed. Try to set it manually.'))
        }
        return matches;
    });
};

module.exports = {
    getUserConfig: getUserConfig,
    setUserConfig: setUserConfig,
    projectConfigAvailable: projectConfigAvailable,
    getProjectConfig: getProjectConfig,
    setProjectConfig: setProjectConfig,
    setDebugTrue: setDebugTrue
};
