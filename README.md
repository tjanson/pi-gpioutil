gpioUtil: A Node wrapper for Wiring Pi's gpio
=============================================

`gpioUtil` is a Node wrapper for the [Wiring Pi **gpio** utility][gpio-util], which manages the Raspberry Pi’s GPIO pins. It currently supports the core functions:

* `export`, `unexport`, `unexportall`,
* `read`, `write`, `pwm`,
* `readall`, `exports`,
* `mode`, `edge`,
* `version`.

(Need anything else? File an issue.)

If you’re not sure what all this is about, please read the [**gpio** utility’s page][gpio-util]. `gpioUtil` is really just a very thin wrapper that allows comfortable invocation from a Node program. Here’s the most important bit:

> **gpio** can control, read and write the GPIO pins, and export/unexport pins via the `/sys/class/gpio` interface, where they will then be available to user programs (without requiring root privileges).  

**gpio** and `gpioUtil` are by nature *not* suited for very frequent read/writes (say, more than one call per minute).  
(If that’s what you need, try [wiring-pi][wpi-node-addon], which has Node bindings to the native Wiring Pi library. [In my experience][piswitch], it’s fast enough for sub-millisecond precision.)

[gpio-util]: http://wiringpi.com/the-gpio-utility/
[wpi-node-addon]: https://github.com/eugeneware/wiring-pi)
[piswitch]: https://github.com/tjanson/PiSwitch

Wiring Pi Installation
----------------------

If you haven’t already, please install Wiring Pi, which includes the **gpio** utility, [as described on their website][wpi-install].
[wpi-install]: http://wiringpi.com/download-and-install/

Usage
-----

Here’s a simple example of how `gpioUtil` might be used:

```javascript
var gpioUtil = require('pi-gpioUtil');
var pinBcm = 17; // BCM numbering
var pinWiring = 0; // Wiring Pi numbering (yes, this is confusing)
gpioUtil.export(pinBcm, 'in', function(err) {
  if (!err) {
    gpioUtil.read(pinWiring, function(err, stdout, stderr, value) {
      if (value) console.log('Input is HIGH!');
    });
  }
});
```

Reference
---------

### General information

All functions have the general form `fct([[pin, [params]], [callback])`, and do the following:

 1. the input parameters are checked for (syntactic) validity
 2. the `gpio` utility is called via [`child_process.exec()`][node-exec]
 3. the `exec()`s `err, stdout, stderr` are passed to the callback (i.e., you may inspect the raw output)
 4. if the call is meant to return data, the utility’s output is converted for easier processing and passed as a fourth parameter (e.g., `readall` provides a JSON representation of all pins)

**Pin numbers** are passed untouched, which means that the Broadcom numbers are used for `[un]export`, while the Wiring Pi numbering scheme is used for everything else. Neither of course matches the physical pin layout.  
Confused? So in everyone else, but [there’s this really pretty pinout reference](http://pi.gadgetoid.com/pinout/wiringpi) by Philip Howard to make up for it.

When reading pins, **high and low voltages** are converted to the boolean `true`/`false`, respectively.

[node-exec]: http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback

### Important functions

Once again, please refer to the [**gpio** utility’s page][gpio-util] for details of what a function *does*; the following will tell you how to *call* it.  
Callback will always be passed `err, stdout, stderr` as the first three arguments.  
Pin numbers are in Wiring Pi format if not noted otherwise.

* [`export(pin, direction, callback)`][exp]: pin in BCM numbering, direction: `'in'` or `'out'`
* [`unexport(pin, callback)`][une]: pin in BCM numbering
* [`read(pin, callback)`][rea]: fourth argument to callback: boolean, `true` for high voltage, `false` for low
* [`write(pin, value, callback`][wri]: `value`: `true`/`false` (or `1`/`0`) for high/low respectively
* [`readall(callback)`][all]: fourth argument to callback: JSON representation of all pins and their states
* [`exports(callback)`][exs]: fourth argument to callback: JSON representation of exported pins
* [`version(callback)`][ver]: fourth argument to callback: version string (e.g., `'2.13'`)

[exp]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L100
[une]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L104
[rea]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L78
[wri]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L69
[all]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L93
[exs]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L112
[ver]: https://github.com/tjanson/pi-gpioUtil/blob/master/gpioUtil.js#L52
