var fs   = require("fs"),
    path = require("path"),
    exec = require("child_process").exec;

var readallParser = require("./readallParser.js");

// name/path of Wiring Pi gpio utility, see
// http://wiringpi.com/download-and-install/
// and http://wiringpi.com/the-gpio-utility/
const gpioExe = "gpio";

// path to the virtual device
const sysFsPath = "/sys/devices/virtual/gpio";

// regular expressions for crude input validation
const validParam = {
    'pin'    : /^20|(1?[0-9])$/,
    'mode'   : /^(in|out|pwm|clock|up|down|tri)$/,
    'onoff'  : /^[01]$/,
    'pwmVal' : /^(10(2[0-3]|[01][0-9]))|([0-9]{1,3})$/, // 0..1023, hopefully
    'inout'  : /^(in|out)$/,
    'edge'   : /^(rising|falling|both|none)$/
};

function gpioExec(command, params, callback) {
    params.forEach(function(param) {
        var name  = param[0];
        var value = param[1];
        if (!validParam[name].test(value)) {
            throw new Error("invalid param: " + name + "('" + value + + "')");
        }
    });
    
    var execString = gpioExe + " " + command + params.reduce(function(string, param) {
        return string + " " + param[1];
    }, "");

    exec(execString, function(err, stdout, stderr) {
        if (err) {
            console.error("ERROR [gpioUtil] exec failed: '" + execString + "':");
            console.error(stderr);
        }
        (callback || function noop(){})(err, stdout, stderr);
    });
}

function parseWarning(cmd) {
    console.error("WARNING [gpioUtil] unexpected result from '" + cmd + "'");
}

var gpioUtil = {
    version: function(callback) {
        gpioExec("-v", [], function(err, stdout, stderr) {
            var versionMatch = /gpio version: (.*)/.exec(stdout);
            // version number is substring match -> stored in vM[1]

            if (versionMatch.length !== 2) {
                parseWarning("version");
            }

            (callback || function noop(){})(err, stdout, stderr, versionMatch[1]);
        });
    },

    mode: function(pin, mode, callback) {
        gpioExec("mode", [['pin',  pin], ['mode', mode]], callback);
    },

    write: function(pin, onoff, callback) {
        if (typeof onoff === 'boolean') onoff = onoff ? 1 : 0;
        gpioExec("write", [['pin', pin], ['onoff', onoff]], callback);
    },

    pwm: function(pin, pwmVal, callback) {
        gpioExec("pwm", [['pin', pin], ['pwmVal', pwmVal]], callback);
    },

    read: function(pin, callback) {
        gpioExec("read", [['pin', pin]], function(err, stdout, stderr) {
            var val;
            if (stdout.trim() === '0') {
                val = false;
            } else if (stdout.trim() === '1') {
                val = true;
            } else {
                parseWarning("read pin " + pin);
            }
            callback(err, stdout, stderr, val);
        });
    },

    readall: function(callback) {
        gpioExec("readall", [], function(err, stdout, stderr) {
            var pins = readallParser.parse(stdout);
            (callback || function noop(){})(err, stdout, stderr, pins);
        });
    },

    export: function(pin, inout, callback) {
        gpioExec("export", [['pin', pin], ['inout', inout]], callback);
    },

    unexport: function(pin, callback) {
        gpioExec("unexport", [['pin', pin]], callback);
    },

    unexportall: function(callback) {
        gpioExec("unexportall", [], callback);
    },

    exports: function(callback) {
        gpioExec("exports", [], function(err, stdout, stderr) {
            var lines = stdout.split('\n').slice(1, -1);
            var exports = [];
            const lineRegex = /([0-9]{1,2}):\s(in|out)\s+(\w)\s+(\w+)/;

            lines.forEach(function(line) {
                var tokens = lineRegex.exec(line);
                if (tokens === null || tokens.length !== 5) {
                    parseWarning("exports (line: '" + line + "')");
                } else {
                    exports.push({ 'pin':       tokens[1],
                                   'direction': tokens[2],
                                   'value':     tokens[3],
                                   'pull':      tokens[4] });
                }
            });
            (callback || function noop(){})(err, stdout, stderr, exports);
        });
    },

    edge: function(pin, edge, callback) {
        gpioExec("edge", [['pin', pin], ['edge', edge]], callback);
    }
};

module.exports = gpioUtil;
