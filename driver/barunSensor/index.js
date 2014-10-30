'use strict';

var util = require('util'),
    net = require('net'),
    _ = require('lodash');

var SensorLib = require('../../index'),
    Sensor = SensorLib.Sensor,
    logger = Sensor.getLogger();


//constants
var BARUN_PORT = 6000,
    REQUEST_STR = 'GET / HTTP/1.1';

//func decl
var initClient, finClient;

function BarunSensor(sensorInfo, options) {
  Sensor.call(this, sensorInfo, options);

  this.temperature = -300; // init

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

  initClient(this);
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
  models: ['CC3200'],
  category: 'sensor'
};

util.inherits(BarunSensor, Sensor);

finClient = function finClient(self) {
  if (self.client) {
    self.client.destroy();
    self.client = null;
    logger.warn('[BarunSensor] finClient', self.ipAddr);
  }
  if (self._timer) {
    clearInterval(self._timer);
    self._timer = null;
  }
};

initClient = function initClient(self) {
  finClient(self);

  self.client = net.connect(BARUN_PORT, self.ipAddr, function (err) {
    if (err) {
      logger.error('[BarunSensor] connect err', self.ipAddr, err);
      finClient(self);
    }
  });

  self.client.on('data', function (data) {
    var rtn,
        deviceData = JSON.parse(data.toString()); 
    /* data format
      {
        "devices": [
          {
            "type":"CC3200",
            "id":"5C313E032441"
          }
        ],
        "sensors": [
          {
            "id":"TMP006",
            "type":"temperature",
            "value":24.72
          }
        ]
      }
     */

    self.temperature = parseFloat(deviceData.sensors[0].value);
    logger.debug('[BarunSensor] temperature', self.temperature, self.ipAddr);

    // FIXME: error and timeout should be implemented.
    //        connection error, disconnect error, wrong value, parse error
    //        connection timeout, response timeout
    //        connection retry, response retry

    rtn = {status: 'ok', id : self.id, result: {'temperature': self.temperature}}; 
    self.temperature = -300;

    //rtn = {status: 'error', id : self.id}; 
    //logger.error('[BarunSensor] _get', self.ipAddr, rtn);

    self.emit('data', rtn);

    return;
  });
};

BarunSensor.prototype._get = function () {
  var self = this, rtn;

  self.client.write(new Buffer(REQUEST_STR));

  logger.error('[BarunSensor] _get', self.ipAddr, rtn);

  return;
};

BarunSensor.prototype._clear = function () {
  logger.warn('[BarunSensor] _clear', this.ipAddr);
  finClient(this);
  return;
};

module.exports = BarunSensor;
