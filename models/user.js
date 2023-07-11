const Sequelize=require("sequelize")
const sequelize= require("../database/database")

const User= sequelize.define('user',{
    name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING, // or DataTypes.TEXT if you expect longer passwords
        allowNull: false,
      },
})

module.exports= User;