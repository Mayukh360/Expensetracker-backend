const sequelize = require("../database/database");

const Sequelize = require("sequelize");

const Download= sequelize.define("download", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  fileUrl: Sequelize.STRING,
 
  
  
});

module.exports = Download;