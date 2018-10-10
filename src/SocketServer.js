const _ = require('lodash');
const { BU, CU } = require('base-util-jh');
const { BM } = require('base-model-jh');

const net = require('net');

const DCC = require('../../device-client-controller-jh');

const { BaseModel } = require('../../device-protocol-converter-jh');

const { mainSocketInfo } = require('./config');

class SocketServer {
  /**
   *
   * @param {mainSocketInfo} config
   * @param {BM} biModule
   */
  constructor(config, biModule) {
    this.config = config || mainSocketInfo;
    this.biModule = biModule;
    this.dcc = new DCC();

    /** @type {string[]} Site UUID 목록 */
    this.siteUUIDList = [];
  }

  createServer() {
    const { port, wrapperCategory } = this.config;
    /** @type {protocol_info} */
    const protocolInfo = {
      wrapperCategory,
    };
    const server = net
      .createServer(socket => {
        console.log(`client is Connected ${port}\n addressInfo: ${socket.remoteAddress}`);

        // 인증 완료 여부
        let hasAuth = false;
        let bufDataStorage = Buffer.from('');
        let errorCount = 0;
        // 인증 요청 메시지 생성
        const authMsg = BaseModel.defaultWrapper.wrapFrameMsg(protocolInfo, 'A');

        // 인증 코드 요청 메시지 발송
        socket.write(authMsg);

        // 3초안에 인증이 이루어지지 않는다면 해당 접속 해제
        const socketTimer = new CU.Timer(() => {
          BU.CLI('socket.end')
          socket.end();
        }, 3000);

        socket.on('data', data => {
          // 인증이 되었기 때문에 socketData는 DCC.Control에서 관리함
          if (hasAuth) return false;
          console.log(`P: ${port} --> Received Data: ${data} `);

          bufDataStorage = Buffer.concat([bufDataStorage, data]);

          // 수신받은 데이터 Frame 제거
          const resUUID = BaseModel.defaultWrapper.peelFrameMsg(protocolInfo, data);

          const strUUID = resUUID.toString();

          // BU.CLIS(resUUID, this.siteUUIDList);

          // 해당 Site UUID가 존재한다면 Passive Client 등록
          if (_.includes(this.siteUUIDList, strUUID)) {
            hasAuth = true;
            // Timer 해제
            socketTimer.getStateRunning && socketTimer.pause();
            // Bindindg 처리
            this.dcc.bindingPassiveClient(strUUID, socket);
          } else {
            // 에러 카운팅 증가
            errorCount += 1;
            // Stream 데이터로 인해 데이터의 짤림을 방지하기 위해 기회를 3번 줌
            if (errorCount > 2) {
              BU.CLI('Auth Code Failed', strUUID);
              // Timer 해제
              socketTimer.getStateRunning && socketTimer.pause();
              BU.CLI('socket.end')
              socket.end();
            }
          }
        });
      })
      .on('error', err => {
        // handle errors here
        console.error('@@@@', err, server.address());
        // throw err;
      });
    // grab an arbitrary unused port.
    server.listen(port, () => {
      console.log('opened server on', port);
    });

    server.on('close', () => {
      console.log('close');
    });

    server.on('error', err => {
      console.error(err);
    });
  }

  /**
   * Main Site UUID 목록 정의
   */
  async setMainSiteUUIDList() {
    // DB에서 main 정보를 가져옴
    /** @type {MAIN[]} */
    const mainList = await this.biModule.getTable('main', { is_deleted: 0 });

    // UUID 목록 생성
    this.siteUUIDList = _.map(mainList, 'uuid');
  }
}
module.exports = SocketServer;
