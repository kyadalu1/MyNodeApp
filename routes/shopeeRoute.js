const express = require("express");
const multer = require("multer");
const cherrio = require("cheerio");
const axios = require("axios");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("dssddssdds");
const CardRawScrape = require("../models/CardRawScrape");

const router = express.Router();
const upload = multer();

router.get("/api/scrapeShopee", upload.none(), async (req, res) => {
  try {
    let itemId, shopId, shopUrl;

    const { url } = req.query;
    itemId = url.substring(url.lastIndexOf("/") + 1);
    shopUrl = url.split(`/${itemId}`)[0];
    shopId = shopUrl.substring(shopUrl.lastIndexOf("/") + 1);
    if (
      Number.isInteger(itemId) === false &&
      Number.isInteger(shopId) === false
    ) {
      itemId = url.substring(url.lastIndexOf(".") + 1);
      shopUrl = url.split("." + itemId)[0];
      shopId = shopUrl.substring(shopUrl.lastIndexOf(".") + 1);
    }

    const response = JSON.parse(
      await scraperApiClient.get(
        `https://shopee.sg/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`
      )
    );
    const moreImages = [];
    const category = [];

    if (
      response.item !== null &&
      response.item.images !== null &&
      response.item.images.length > 0
    ) {
      response.item.images.map((img) =>
        moreImages.push(`https://cf.shopee.sg/file/${img}`)
      );

      response.item.categories.map((cat, index) => {
        if (index !== 0) {
          category.push(cat.display_name);
        }
      });
    }

    const price =
      response.item != null
        ? response.item.price_max.toString().slice(0, -5)
        : "0";
    const isValidPrice = parseInt(price);

    const data = {
      image: `https://cf.shopee.sg/file/${response.item.images[0]}`,
      title: response.item.name,
      sourcePrice:
        isNaN(isValidPrice) ||
        isValidPrice === undefined ||
        isValidPrice === null
          ? 0
          : isValidPrice,
      stars: parseInt(response.item.item_rating.rating_star).toString(),
      description: response.item.description,
      moreImages,
      source: "shopee",
      linkUrl: url,
      currency: "$",
      category:
        response.item != null ? response.item.categories[0].display_name : "",
      subcategory: [category],
      specifications: "",
    };

    console.log(data);
    const cardScrapeResponse = await CardRawScrape.create({
      link_url: data.linkUrl,
      raw_card: JSON.stringify(data),
      image: data.image,
      more_images: data.moreImages.toString(),
      description: data.description,
      title: data.title,
      category: data.category,
      specifications: data.specifications.toString(),
      stars: data.stars,
      source: data.source,
      currency: data.currency,
      subcategory: data.subcategory.toString(),
    });
    return res.status(200).send({
      status: 1,
      msg: "Success",
      data,
      cardScrapeId: cardScrapeResponse.card_scrape_id,
    });

    // axios
    //   .post(SAVE_RAW_CARD_URL, {
    //     rawCard: JSON.stringify(data),
    //   })
    //   .then((saveRawCardResponse) => {
    //     return res.status(200).send({
    //       status: 1,
    //       msg: "Success",
    //       data,
    //       cardScrapeId: saveRawCardResponse.data.cardScrapeId,
    //     });
    //   })
    //   .catch((err) => {
    //     return res.status(422).send({ status: 0, msg: err.toString() });
    //   });
  } catch (e) {
    return res.status(422).send({ status: 0, msg: "Error getting data" });
  }
});

module.exports = router;
