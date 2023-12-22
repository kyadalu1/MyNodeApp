const Sequelize = require("sequelize");
const dayjs = require("dayjs");
const sequelize = require("../util/database");

const CardRawScrape = sequelize.define(
  "card_raw_scrape",
  {
    card_scrape_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    link_url: {
      type: Sequelize.STRING(655),
      allowNull: false,
    },
    raw_card: { type: Sequelize.TEXT, allowNull: false },
    source_price: {
      type: Sequelize.DECIMAL(10, 2),
    },
    image: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    more_images: { type: Sequelize.TEXT, allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: false },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    specifications: { type: Sequelize.TEXT, allowNull: false },
    created_date: {
      type: "TIMESTAMP",
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    modified_date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    stars: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    source: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
    },
    subcategory: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    tableName: "card_raw_scrape",
    timestamps: false,
  }
);

module.exports = CardRawScrape;
