'use strict';

var util = require('util'),
    http = require('http');

var SensorLib = require('../../index'),
    Sensor = SensorLib.Sensor,
    logger = Sensor.getLogger();


//constants
var BARUN_PORT = 6000;
var ag = new http.Agent({maxSockets: 1});

function BarunSensor(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);

  this.options = {
    port: BARUN_PORT,
    path: '/',
    method: 'GET',
    agent: ag
    //headers: {
      //'Connection': 'keep-alive'
    //}
  };

  if (sensorInfo.model) {
    this.model = sensorInfo.model;
  }
  if (sensorInfo.device) {
    this.ipAddr = sensorInfo.device.address;
    this.options.hostname = this.ipAddr;
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

  var req = http.get(self.options, function (res) {
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
  });
  req.on('error', function (e) {
    rtn.message = 'get error:' + e.toString();
    logger.error('[BarunSensor] _get', self.ipAddr, rtn);
    self.emit('data', rtn);
  }).setTimeout(BarunSensor.properties.recommendedInterval / 2, function () {
    rtn.message = 'get timeout';
    logger.error('[BarunSensor] _get', self.ipAddr, rtn);
    self.emit('data', rtn);
  });

  logger.debug('request', req);

  return;
};

BarunSensor.prototype._clear = function () {
  logger.warn('[BarunSensor] _clear', this.ipAddr);
  return;
};

module.exports = BarunSensor;
