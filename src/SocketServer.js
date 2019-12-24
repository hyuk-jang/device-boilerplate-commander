const _ = require('lodash');
const { BU, CU } = require('base-util-jh');
const { BM } = require('base-model-jh');

const net = require('net');

const DCC = require('../../device-client-controller-jh');

const { BaseModel } = require('../../device-protocol-converter-jh');

const { createSocketServerInfo } = require('./config');

class SocketServer {
  /**
   *
   * @param {mainSocketInfo} config
   * @param {BM} biModule
   */
  constructor(config = createSocketServerInfo, biModule) {
    this.config = config;
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
        console.log(`client is Connected ${port}\naddressInfo: ${socket.remoteAddress}`);

        try {
          // 인증 완료 여부
          let hasAuth = false;
          let bufDataStorage = Buffer.from('');
          let errorCount = 0;

          let strResUUID;
          // 인증 요청 메시지 생성 (default: 인증)
          const authMsg = BaseModel.defaultWrapper.wrapFrameMsg(protocolInfo);

          // 인증 코드 요청 메시지 발송
          socket.write(authMsg);

          // 3초안에 인증이 이루어지지 않는다면 해당 접속 해제
          const socketTimer = new CU.Timer(() => {
            BU.CLI(`${strResUUID} does not exist ${socket.remoteAddress} `);
            socket.end();
          }, 3000);

          socket.on('data', data => {
            // console.log(data);
            // 인증이 되었기 때문에 socketData는 DCC.Control에서 관리함
            if (hasAuth) return false;
            console.log(`P: ${port} --> Received Data: ${data} `);

            bufDataStorage = Buffer.concat([bufDataStorage, data]);

            // 수신받은 데이터 Frame 제거
            const resUUID = BaseModel.defaultWrapper.peelFrameMsg(protocolInfo, data);

            strResUUID = !_.isUndefined(resUUID) && resUUID.toString();

            // BU.CLIS(strResUUID, this.siteUUIDList);

            // 해당 Site UUID가 존재한다면 Passive Client 등록
            if (_.includes(this.siteUUIDList, strResUUID)) {
              hasAuth = true;
              // Timer 해제
              socketTimer.getStateRunning && socketTimer.pause();
              // Bindindg 처리

              _.set(server, 'siteId', strResUUID);

              this.dcc.bindingPassiveClient(strResUUID, socket);
            } else {
              // 에러 카운팅 증가
              errorCount += 1;
              // Stream 데이터로 인해 데이터의 짤림을 방지하기 위해 기회를 3번 줌
              if (errorCount > 2) {
                BU.CLI('Auth Code Failed', strResUUID);
                // Timer 해제
                socketTimer.getStateRunning && socketTimer.pause();
                BU.CLI('socket.end');
                socket.end();
              }
            }
          });

          socket.on('close', () => {
            BU.CLI('socketClient is closed', _.get(server, 'siteId'));
          });
          socket.on('error', err => {
            BU.CLI(_.get(server, 'siteId'), err);
            // socket.end();
          });
        } catch (error) {
          BU.logFile(error);
        }
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
      BU.CLI(err);
      // console.error(err);
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
