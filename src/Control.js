const _ = require('lodash');
const Promise = require('bluebird');

const { BM } = require('../../base-model-jh');
const { BU } = require('../../base-util-jh');

require('../../default-intelligence');

const DBS = require('../../device-boilerplate-sensor/src/Control');
const DBP = require('../../device-boilerplate-power');

const dsmConfig = require('./config');

class Control {
  /**
   *
   * @param {dsmConfig} config
   */
  constructor(config) {
    this.config = config || dsmConfig;

    // this.biModule = new BM({
    //   /** 접속 주소 구동 */
    //   host: 'localhost',
    //   /** user ID */
    //   user: 'fp',
    //   /** user password */
    //   password: 'smsoftware',
    //   /** 사용할 port */
    //   port: 3306,
    //   /** 사용할 database */
    //   database: 'FARM_PARALLEL',
    // });

    /** @type {DBS[]} */
    this.controllerListDBS = [];
    /** @type {DBP[]} */
    this.controllerListDBP = [];
  }

  /**
   * @desc Step 1
   * Main Storage List를 초기화
   * @param {dbInfo=} dbInfo
   */
  async setControllerListDBS(dbInfo) {
    dbInfo = dbInfo || this.config.dbInfo;

    // BU.CLI(dbInfo)
    this.biModule = new BM(dbInfo);

    // DB에서 main 정보를 가져옴
    /** @type {MAIN[]} */
    let mainList = await this.biModule.getTable('main', { is_deleted: 0 });

    // main Seq 순으로 정렬
    mainList = _.sortBy(mainList, 'main_seq');
    // Main 정보 만큼 DBS List 생성
    mainList.forEach(mainInfo => {
      const controllerDBS = new DBS(_.assign(this.config, { uuid: mainInfo.uuid }));
      // 해당 DBS Main UUID 정의
      controllerDBS.mainUUID = mainInfo.uuid;
      this.controllerListDBS.push(controllerDBS);
    });

    // BU.CLIN(this.controllerListDBS);
    // this.controllerListDBS = [_.nth(this.controllerListDBS, 1)];
    // BU.CLIN(this.controllerListDBS);

    // DBS 초기화가 끝날떄까지 기다림
    await Promise.map(this.controllerListDBS, controllerDBS =>
      // BU.CLIN(controllerDBS);
      controllerDBS
        .getDataLoggerListByDB()
        .then(() => controllerDBS.init())
        .then(() => {
          controllerDBS.inquiryAllDeviceStatus();
          Promise.resolve();
        })
        .catch(err => {
          Promise.reject(err);
        }),
    );

    return this.controllerListDBS;
  }

  async selectMap() {
    const result = await this.biModule.getTable('main_map');

    const file = result[0];
    const map = file.contents;

    const r = JSON.parse(map);
    BU.CLI(r.drawInfo);
  }

  // TODO: SetDBP
  SetDBP() {}

  // TODO: SetDBS
  SetDBS() {}

  // TODO: ListenSocketServer
  ListenSocketServer() {}
}
module.exports = Control;
