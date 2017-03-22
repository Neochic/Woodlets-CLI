var Downloader = require('./downloader');

var download = function() {
    return Downloader.download(
        'https://github.com/Neochic/Woodlets-Seed/archive/master.zip',
        'Woodlets-Seed template',
        'src',
        '.',
        'Woodlets-Seed-master/'
    );
};

module.exports = {
    download: download
};
