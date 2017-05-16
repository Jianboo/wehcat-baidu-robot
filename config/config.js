var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'wehcat-baidu-robot'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/wehcat-baidu-robot-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'wehcat-baidu-robot'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/wehcat-baidu-robot-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'wehcat-baidu-robot'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/wehcat-baidu-robot-production'
  }
};

module.exports = config[env];
