// const DccFacade = require('device-client-controller-jh');
// const dpc = require('device-protocol-converter-jh');
// const di = require('default-intelligence');

const DccFacade = require('../../device-client-controller-jh');
const Dbs = require('../../device-boilerplate-sensor');
const dpc = require('../../device-protocol-converter-jh');
const di = require('../../default-intelligence');

module.exports = {
  Dbs,
  dpc,
  di,
  DccFacade,
};
