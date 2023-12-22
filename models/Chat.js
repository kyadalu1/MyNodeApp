const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Chat = sequelize.define(
  "chat_history",
  {
    chat_history_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    message_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    send_by: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    message_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    created_date: {
      type: Sequelize.DATE,
    },
  },
  {
    freezeTableName: true,
    tableName: "chat_history",
    timestamps: false,
  }
);

module.exports = Chat;
