const Sequelize = require("sequelize");

const sequelize = new Sequelize("my_database", "myaao", "myaao2020", {
  dialect: "mysql",
  port: 3306,
  host: "mydatabase.amazonaws.com",
  pool: {
    max: 2,
    min: 0,
    acquire: 120000,
    idle: 120000,
    evict: 120000,
  },
  dialectOptions: {
    connectTimeout: 60000,
  },
});

module.exports = sequelize;
