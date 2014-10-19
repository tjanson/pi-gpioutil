var fs   = require("fs"),
    path = require("path"),
    exec = require("child_process").exec;

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

var gpioUtil = {
    version: function(callback) {
        gpioExec("-v", [], callback);
    },

    mode: function(pin, mode, callback) {
        gpioExec("mode", [['pin',  pin], ['mode', mode]], callback);
    },

    write: function(pin, onoff, callback) {
        gpioExec("write", [['pin', pin], ['onoff', onoff]], callback);
    },

    pwm: function(pin, pwmVal, callback) {
        gpioExec("pwm", [['pin', pin], ['pwmVal', pwmVal]], callback);

    },

    read: function(pin, callback) {
        gpioExec("read", [['pin', pin]], function(err, stdout, stderr) {
            var val;
            if (stdout === '0\n') {
                val = false;
            } else if (stdout === '1\n') {
                val = true;
            } else {
                console.error("WARNING [gpioUtil] unexpected result from 'read'");
            }
            callback(val);
        });
    },

    readall: function(callback) {
        gpioExec("readall", [], callback);
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
        gpioExec("exports", [], callback);
    },

    edge: function(pin, edge, callback) {
        gpioExec("edge", [['pin', pin], ['edge', edge]], callback);
    }
};

module.exports = gpioUtil;
