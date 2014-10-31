'use strict';

var util = require('util'),
    http = require('http');

var SensorLib = require('../../index'),
    Sensor = SensorLib.Sensor,
    logger = Sensor.getLogger();


//constants
var BARUN_PORT = 6000;

function BarunSensor(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  }
  if (sensorInfo.device) {
    this.ipAddr = sensorInfo.device.address;
  }

  if (!this.ipAddr) {
    logger.fatal('[BarunSensor] no ipAddr', sensorInfo);
    //FIXME: throw error
    return;
  }

  logger.debug('BarunSensor', sensorInfo);
}

BarunSensor.properties = {
  supportedNetworks: ['barun'],
  dataTypes: ['temperature'],
  onChange: false,
  discoverable: false,
  addressable: true,
  recommendedInterval: 10000,
  maxInstances: 1,
  idTemplate: '{model}-{address}',
  models: ['CC3200S'],
  category: 'sensor'
};

util.inherits(BarunSensor, Sensor);

BarunSensor.prototype._get = function () {
  var self = this, 
  rtn = {status: 'error', id : self.id}; 

  http.get('http://' + self.ipAddr + ':' + BARUN_PORT, function (res) {
    res.on('data',function (msg) {
      var v;
      try { v = JSON.parse(msg); } catch (e) {}
      if (v && v.sensors && v.sensors[0]) {
        rtn = {status: 'ok', id : self.id, result: {}};
        rtn.result[v.sensors[0].type] = v.sensors[0].value;
        logger.info('[BarunSensor] _get', self.ipAddr, rtn);
      } else {
        rtn.message = 'unknown val:' + v && JSON.stringify(v);
        logger.error('[BarunSensor] _get', self.ipAddr, rtn);
      }
      self.emit('data', rtn);
    });
  }).on('error', function (e) {
    rtn.message = 'get error:' + e.toString();
    logger.error('[BarunSensor] _get', self.ipAddr, rtn);
    self.emit('data', rtn);
  }).setTimeout(BarunSensor.properties.recommendedInterval / 2, function () {
    rtn.message = 'get timeout';
    logger.error('[BarunSensor] _get', self.ipAddr, rtn);
    self.emit('data', rtn);
  });

  return;
};

BarunSensor.prototype._clear = function () {
  logger.warn('[BarunSensor] _clear', this.ipAddr);
  return;
};

module.exports = BarunSensor;
