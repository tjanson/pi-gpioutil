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
    before(function() {
      gpioUtil.unexport(testPin, function(err){});
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
    beforeEach(function() {
      gpioUtil.export(testPin, 'out', function(err){});
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

});
