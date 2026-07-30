const sequelize = require('../config/config');
const User = require('./user');

module.exports = {
  sequelize,
  User,
};
// add relation ships between users and tasks , projects
