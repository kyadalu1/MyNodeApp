const express = require("express");
const multer = require("multer");
const cheerio = require("cheerio");
const axios = require("axios");
const WebScraping = require("../models/WebScraping");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("dsdsdsdds");
const CardRawScrape = require("../models/CardRawScrape");

const router = express.Router();
const upload = multer();

router.get("/api/scrapeTokopedia", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const response = await scraperApiClient.get(url);
    const $ = cheerio.load(response);
    const scraper = await WebScraping.findOne({ where: { name: "tokopedia" } });
    console.log(scraper);
    console.log(scraper.title);
    if (scraper === null) {
      return res
        .status(422)
        .send({ status: 0, msg: "No such site in database" });
    } else {
      const moreImages = [];
      $(scraper.more_images).each(function (index, element) {
        moreImages.push($(element).attr("src"));
      });
      const title = $(scraper.title).text();
      const fullPrice = $(scraper.price).text();
      const currency = fullPrice.substring(0, 2);
      const price = fullPrice.substring(2);
      const description = $(scraper.description).text();
      const category = [];
      $(scraper.category).each(function (index, element) {
        category.push($(element).text());
      });
      const stars = $(`span[data-testid=${scraper.stars}]`).text();
      const data = {
        image: moreImages[0],
        title,
        sourcePrice:
          isNaN(price) || price === undefined || price === null || price === ""
            ? 0
            : price,
        stars,
        description: description,
        moreImages,
        source: "tokopedia",
        linkUrl: url,
        currency,
        category: category[0],
        subcategory: category.splice(1),
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
      //     return res.status(422).send({ status: 0, msg: err.toString(), data });
      //   });
    }
  } catch (e) {
    return res.status(422).send({ status: 0, msg: "Error getting data" });
  }
});

// router.get("/api/scrapeTokopedia", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cheerio.load(response);
//     const moreImages = [];
//     $(".success.fade").each(function (index, element) {
//       moreImages.push($(element).attr("src"));
//     });
//     const title = $(".css-x7lc0h").text();
//     const fullPrice = $(".css-c820vl").text();
//     const currency = fullPrice.substring(0, 2);
//     const price = fullPrice.substring(2);
//     const description = $(".css-olztn6-unf-heading.e1qvo2ff8").text();
//     const category = [];
//     $(".css-yoyor-unf-heading.e1qvo2ff7").each(function (index, element) {
//       category.push($(element).text());
//     });
//     const stars = $(
//       'span[data-testid="lblPDPDetailProductRatingNumber"]'
//     ).text();
//     const data = {
//       image: moreImages[0],
//       title,
//       sourcePrice: price,
//       stars,
//       description: description,
//       moreImages,
//       source: "tokopedia",
//       linkUrl: url,
//       currency,
//       category: category[0],
//       subcategory: category.splice(1),
//       specifications: "",
//     };

//     console.log(data);
//     axios
//       .post(SAVE_RAW_CARD_URL, {
//         rawCard: JSON.stringify(data),
//       })
//       .then((saveRawCardResponse) => {
//         return res.status(200).send({
//           status: 1,
//           msg: "Success",
//           data,
//           cardScrapeId: saveRawCardResponse.data.cardScrapeId,
//         });
//       })
//       .catch((err) => {
//         return res.status(422).send({ status: 0, msg: err.toString() });
//       });
//   } catch (e) {
//     return res.status(422).send({ status: 0, msg: "Error getting data" });
//   }
// });

module.exports = router;
