const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const WebScraping = sequelize.define(
  "web_scraping",
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING(200),
    },
    landing_image: {
      type: Sequelize.STRING(200),
    },
    title: {
      type: Sequelize.STRING(200),
    },
    price: {
      type: Sequelize.STRING(200),
    },
    currency: {
      type: Sequelize.STRING(200),
    },
    stars: {
      type: Sequelize.STRING(200),
    },
    description: {
      type: Sequelize.STRING(200),
    },
    more_images: {
      type: Sequelize.STRING(200),
    },
    category: {
      type: Sequelize.STRING(200),
    },
    subcategory: {
      type: Sequelize.STRING(200),
    },
    specifications: {
      type: Sequelize.STRING(200),
    },
  },
  {
    freezeTableName: true,
    tableName: "web_scraping",
    timestamps: false,
  }
);

module.exports = WebScraping;
