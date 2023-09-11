const sequelize = require("../database/database");
const Sequelize = require("sequelize");

const { v4: uuidv4 } = require("uuid"); 

const Request = sequelize.define("Request", {
  id: {
    type: Sequelize.UUID, // Use UUID data type for id
    defaultValue: Sequelize.UUIDV4, // Generate UUID automatically on creation
    primaryKey: true,
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true, 
  },
});

module.exports = Request;
