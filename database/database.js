const Sequelize = require('sequelize');
const sequelize = new Sequelize("expense-tracker", "root", "W@2915djkq#", {
  dialect: "mysql",
  host: "localhost",

});

module.exports = sequelize;