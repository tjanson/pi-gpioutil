'use strict';

var gpioUtil = require('../gpioUtil.js');
var should   = require('should');
var fs       = require('fs');

const sysPath = '/sys/devices/virtual/gpio';
const testPin    = 17; // bcm numbering
const testPinWPi = 0;  // same pin but in Wiring Pi numbering (yes, this is needlessly confusing)

describe('pi-gpioUtil', function() {

  describe('.version()', function() {
    it('should return the gpio util version', function(done) {
      gpioUtil.version(function(err, stdout, stderr, ver) {
        should.not.exist(err);
        ver.should.exist;
        done();
      });
    });
  });

  describe('hooks', function() {
    before('unexport testPin', function(done) {
      gpioUtil.unexport(testPin, done);
    });

    describe('.export()', function() {
      ['in', 'out'].forEach(function(direction) {
        it('should export testPin so it has the given direction: ' + direction, function(done) {
          gpioUtil.export(testPin, direction, function() {
            fs.readFile(sysPath + '/gpio' + testPin + '/direction', 'utf8', function(err, data) {
              should.not.exist(err);
              data.trim().should.equal(direction);
              done();
            });
          });
        });
      });
    });
  });


  describe('hooks', function() {
    beforeEach('export testPin', function(done) {
      gpioUtil.export(testPin, 'out', done);
    });

    describe('.unexport()', function() {
      it('should remove testPin from sysPath', function(done) {
        gpioUtil.unexport(testPin, function() {
          fs.exists(sysPath + '/gpio' + testPin, function(exists) {
            exists.should.equal(false);
            done();
          });
        });
      });
    });

    describe('.write()', function() {
      [1, 0].forEach(function(onoff) {
        it('should be reflected in `/value`: ' + onoff, function(done) {
          gpioUtil.write(testPinWPi, onoff, function(err, stdout, stderr) {
            should.not.exist(err);
            fs.readFile(sysPath + '/gpio' + testPin + '/value', 'utf8', function(err, data) {
              should.not.exist(err);
              data.trim().should.equal(onoff.toString());
              done();
            });
          });
        });
      });
    });
  });

  [1, 0].forEach(function(onoff) {
    describe('hooks', function() {
      beforeEach('export testPin and write ' + onoff, function(done) {
        gpioUtil.export(testPin, 'out', function(err) {
          gpioUtil.write(testPinWPi, onoff, done);
        });
      });

      describe('.read()', function() {
        it('should read ' + (onoff === 1 ? 'true' : 'false') + ' on a pin set to' + onoff, function(done) {
          gpioUtil.read(testPinWPi, function(err, stdout, stderr, val) {
            should.not.exist(err);
            val.should.equal((onoff === 1 ? true : false));
            done();
          });
        });
      });
    });

    describe('.readall()', function() {
      it('should return an array of 16 to 40 pins with testPin ' + onoff, function(done) {
        gpioUtil.readall(function(err, stdout, stderr, pins) {
          should.not.exist(err);

          // FIXME: check whether it's 26 OR 40, not 26 TO 40
          // not sure how to do an "OR" in should.js...(!)
          pins.should.be.instanceof(Array);
          pins.length.should.be.within(16, 40);

          function isTestPin(pin) {
            return pin.bcm === testPin;
          }
          var tp = pins.filter(isTestPin);
          tp.should.not.be.empty;
          tp[0].value.should.equal(onoff === 1 ? true : false);
          done();
        });
      });
    });
  });

});
