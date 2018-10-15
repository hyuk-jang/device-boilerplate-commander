require('dotenv').config();

const config = {
  mainSocketInfo: {
    port: process.env.WEB_SOCKET_PORT,
    wrapperCategory: 'default',
  },
  dbInfo: {
    port: process.env.WEB_DB_PORT || '3306',
    host: process.env.WEB_DB_HOST || 'localhost',
    user: process.env.WEB_DB_USER || 'root',
    password: process.env.WEB_DB_PW || 'test',
    database: process.env.WEB_DB_DB || 'test',
  },
  inquiryIntervalSecond: 10,
  inquiryWaitingSecond: 60,
};
module.exports = config;
