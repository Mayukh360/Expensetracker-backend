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
        type: Sequelize.STRING, 
        allowNull: false,
      },
      isPremium: {
        type: Sequelize.BOOLEAN, 
        defaultValue: false,
      },
      totalexpense: {
        type: Sequelize.DOUBLE,
        defaultValue:0
      },
})

module.exports= User;