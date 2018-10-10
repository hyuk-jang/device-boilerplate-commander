const Control = require('./src/Control');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');
  // const config = require('./src/config');
  const { BU } = require('base-util-jh');

  const config = require('./src/config');

  const controller = new Control(config);
  controller
    .setControllerListForDBS()
    .then(dbsList =>
      // BU.CLI(dbsList);
      controller.operationServer(),
    )
    .then(() => {
      BU.CLI('operation Server');
    })
    .catch(console.debug);
  // controller.selectMap();

  process.on('uncaughtException', err => {
    // BU.debugConsole();
    BU.CLI(err);
    console.log('Node NOT Exiting...');
  });

  process.on('unhandledRejection', err => {
    // BU.debugConsole();
    BU.CLI(err);
    console.log('Node NOT Exiting...');
  });
}
