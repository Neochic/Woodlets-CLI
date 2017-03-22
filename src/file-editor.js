var fs = require('fs');
var rxjs = require('rxjs');

var editFile = function(file, filter) {
    var subject = new rxjs.Subject();

    fs.readFile(file, "utf-8", function(err, text) {
        var oldText = text;

        if (err) {
            subject.error(err);
        }

        text = filter(text);

        if(oldText === text) {
            subject.next();
            return;
        }

        fs.writeFile(file, text, function(err) {
            if (err) {
                subject.error(err);
            }

            subject.next();
        });
    });

    return subject;
};

var find = function(file, regexp) {
    var matches = null;
    return editFile(file, function(text) {
        matches = regexp.exec(text);
        return text;
    }).map(function() {
        return matches;
    });
};

var replace = function(file, regexp, replaceValue) {
    var matches = null;
    return editFile(file, function(text) {
        matches = text.match(regexp);
        return text.replace(regexp, replaceValue);
    }).map(function() {
        return matches ? matches.length : 0;
    });
};

var insert = function(file, position, replaceValue, fallbackPosition, fallbackValue) {
    if (typeof fallbackPosition === "undefined" || fallbackPosition !== 0) {
        fallbackPosition = -1;
    }

    if (typeof fallbackValue === "undefined") {
        fallbackValue = replaceValue;
    }

    var matches = null;
    var staticPositionInsert = function(text, position, replaceValue) {
        if (position === 0) {
            matches = [null];
            return replaceValue + "\n" + text;
        }

        if (position === -1) {
            matches = [null];
            return text + "\n" + replaceValue;
        }

        return text;
    };
    return editFile(file, function(text) {
        text = staticPositionInsert(text, position, replaceValue);

        if (matches) {
            return text;
        }

        matches = text.match(position);
        if (matches.length > 0) {
            return text.replace(position, replaceValue);
        }

        return staticPositionInsert(text, fallbackPosition, fallbackValue);
    }).map(function() {
        return matches ? matches.length : 0;
    });
};

module.exports = {
    find: find,
    replace: replace,
    insert: insert
};
