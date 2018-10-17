const _ = require('lodash');
const Promise = require('bluebird');

const SocketServer = require('./SocketServer');

const { BM } = require('../../base-model-jh');
const { BU } = require('../../base-util-jh');

require('../../default-intelligence');

const DBS = require('../../device-boilerplate-sensor');
const DBP = require('../../device-boilerplate-power');

const dsmConfig = require('./config');

class Control {
  /**
   *
   * @param {dsmConfig} config
   * @param {dbInfo=} dbInfo
   */
  constructor(config = dsmConfig, dbInfo = config.dbInfo) {
    this.config = config;
    BU.CLI(dbInfo);

    this.biModule = new BM(dbInfo);

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

    /** @type {MAIN[]} */
    this.siteList = [];

    /** @type {DBS[]} */
    this.controllerListForDBS = [];
    /** @type {DBP[]} */
    this.controllerListForDBP = [];
  }

  /**
   * @desc Step 1
   * DBS 객체 목록 생성 및 구동
   */
  async setControllerListForDBS() {
    BU.CLI('setControllerListForDBS');
    // Main 정보 만큼 DBS List 생성
    this.siteList.forEach(mainInfo => {
      const cloneConfig = _.cloneDeep(this.config);
      cloneConfig.uuid = mainInfo.uuid;
      const controllerDBS = new DBS(cloneConfig);
      // 해당 DBS Main UUID 정의
      controllerDBS.mainUUID = mainInfo.uuid;
      this.controllerListForDBS.push(controllerDBS);
    });

    // BU.CLIN(this.controllerListDBS);
    // this.controllerListDBS = [_.nth(this.controllerListDBS, 1)];
    // BU.CLIN(this.controllerListDBS);

    // DBS 초기화가 끝날떄까지 기다림
    // this.controllerListDBS 객체 목록 순회
    await Promise.map(this.controllerListForDBS, controllerDBS =>
      // BU.CLIN(controllerDBS);
      controllerDBS
        // DBS에 정의된 UUID를 기준으로 DB.main Table UUID를 비교하여 DLC 객체를 생성하기 위한 DL 및 Node 객체 정의
        .getDataLoggerListByDB()
        // 관련된 DLC 객체 목록을 생성
        .then(() => controllerDBS.init())
        // DBS 객체 구동 시작
        .then(() => {
          controllerDBS.runDeviceInquiryScheduler();
          // controllerDBS.inquiryAllDeviceStatus();
          Promise.resolve();
        })
        .catch(err => {
          Promise.reject(err);
        }),
    );

    // const wfk = _.map(this.controllerListForDBS, dl => {
    //   const pickInfo = _.pick(dl.dataLoggerInfo, ['main_seq', 'm_name', 'dl_real_id']);
    //   pickInfo.mainUUID = this.mainUUID;
    //   return pickInfo;
    // });
    // BU.CLI(wfk)

    // return this.config;

    return this.controllerListForDBS;
  }

  /** MAIN DB Table을 가지고 오고 seq 순서대로 정렬 */
  async setMainList() {
    /** @type {MAIN[]} */
    const siteList = await this.biModule.getTable('main', { is_deleted: 0 }, false);
    this.siteList = _.sortBy(siteList, 'main_seq');
    return this.siteList;
  }

  /**
   * @desc Step 2
   * DBS 객체 목록 생성 및 구동
   */
  async setControllerListForDBP() {
    BU.CLI('setControllerListForDBP');

    const dbpController = new DBP(_.cloneDeep(this.config));

    const deviceControllerList = await dbpController.init(this.config.dbInfo);
    dbpController.runDeviceInquiryScheduler();
    return deviceControllerList;
  }

  /**
   * @desc Step 2
   * Server 구동
   */
  async operationServer() {
    BU.CLI('operationServer');
    // Socket Server 정보가 있다면 구동
    if (!_.isEmpty(this.config.createSocketServerInfo)) {
      const socketServer = new SocketServer(this.config.createSocketServerInfo, this.biModule);
      await socketServer.setMainSiteUUIDList();
      socketServer.createServer();
    }
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
