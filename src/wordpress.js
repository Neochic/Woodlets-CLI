var Downloader = require('./downloader');

var download = function() {
    return Downloader.download(
        'https://wordpress.org/latest.zip',
        'WordPress',
        'public',
        'public',
        'wordpress/'
    );
};

module.exports = {
    download: download
};
