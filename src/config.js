require('dotenv').config();

const config = {
  mainSocketInfo: {
    port: process.env.WEB_SOCKET_PORT,
    wrapperCategory: 'default',
  },
  dbInfo: {
    port: process.env.WEB_DB_PORT ? process.env.WEB_DB_PORT : '3306',
    host: process.env.WEB_DB_HOST ? process.env.WEB_DB_HOST : 'localhost',
    user: process.env.WEB_DB_USER ? process.env.WEB_DB_USER : 'root',
    password: process.env.WEB_DB_PW ? process.env.WEB_DB_PW : 'test',
    database: process.env.WEB_DB_DB ? process.env.WEB_DB_DB : 'test',
  },
  inquiryIntervalSecond: 10,
};
module.exports = config;
