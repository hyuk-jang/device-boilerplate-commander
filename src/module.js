// const DccFacade = require('device-client-controller-jh');
// const dpc = require('device-protocol-converter-jh');
// const di = require('default-intelligence');

const DccFacade = require('../../device-client-controller-jh');
const Dbs = require('../../device-boilerplate-sensor');
const Dbp = require('../../device-boilerplate-power');
const dpc = require('../../device-protocol-converter-jh');
const di = require('../../default-intelligence');

module.exports = {
  Dbs,
  Dbp,
  dpc,
  di,
  DccFacade,
};
