const headerStandard = "| wiringPi | GPIO | Phys | Name   | Mode | Value |";
const headerBPlus = " | BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |";

function determineFormat(header) {
    switch (header) {
        case headerStandard:
            return 'standard';
            break;
        case headerBPlus:
            return 'bplus';
            break;
        default:
            return undefined;
            break;
    }
}

function tokenize(line) {
    var tokens = [];
    line.split('|').slice(1, -1).forEach(function(token) {
        tokens.push(token.trim());
    });
    return tokens;
}

function parsePin(wiring, bcm, phys, name, mode, value) {
    function highLowToBool(string) {
        switch(string.toLowerCase()) {
            case '1':
            case 'high':
                return true;
                break;
            case '0':
            case 'low':
                return false;
                break;
            default:
                return undefined;
                break;
         }
    }

    var pinObj = {
        'wiring': parseInt(wiring),
        'bcm':    parseInt(bcm),
        'phys':   parseInt(phys),
        'name':   name,
        'mode':   mode.toLowerCase,
        'value':  highLowToBool(value)
    };
    return pinObj;
}

function parseLine(pins, format, tokens) {
    if (format === 'standard') {
        if (tokens.length !== 6) {
            parseWarning("readall (line: '" + line + "')");
        } else {
            var t = tokens;
            pins.push(parsePin(t[0], t[1], t[2], t[3], t[4], t[5]));
        }
    } else if (format === 'bplus') {
        if (tokens.length !== 13) {
            parseWarning("readall (line: '" + line + "')");
        } else {
            // B+ readall has two pins per line, symmetrical layout, [6] is empty

            // left side
            var t = tokens.slice(0, 6);
            pins.push(parsePin(t[1], t[0], t[5], t[2], t[3], t[4]));

            // right side, order mirrored
            t = tokens.slice(7);
            pins.push(parsePin(t[4], t[5], t[0], t[3], t[2], t[1]));
        }
    }
}

function parse(stdout) {
    var header = stdout.split('\n')[1]; // second line is header
    var lines  = stdout.split('\n').slice(3, -3); // cut off header/footer

    var format = determineFormat(header);
    if (typeof format === 'undefined') {
        parseWarning("readall (unknown format)");
        (callback || function noop(){})(err, stdout, stderr);
    } else if (format === 'bplus') {
        lines.pop(); // remove extra empty-line
    }

    var pins = [];
    lines.forEach(function(line) {
        parseLine(pins, format, tokenize(line));
    });
    return pins;
}

exports.parse = parse;
