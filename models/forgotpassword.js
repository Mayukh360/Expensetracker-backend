const sequelize = require("../database/database");
const Sequelize = require("sequelize");

const { v4: uuidv4 } = require("uuid"); // Import the uuid library and use v4 to generate UUIDs

// Define the Request model
const Request = sequelize.define("Request", {
  id: {
    type: Sequelize.UUID, // Use UUID data type for id
    defaultValue: Sequelize.UUIDV4, // Generate UUID automatically on creation
    primaryKey: true,
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true, // Set default value to true to indicate active requests
  },
});

module.exports = Request;
