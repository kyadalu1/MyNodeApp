const express = require("express");
const multer = require("multer");
const cherrio = require("cheerio");
const axios = require("axios");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("ddswewew");
const CardRawScrape = require("../models/CardRawScrape");
const WebScraping = require("../models/WebScraping");
const router = express.Router();
const upload = multer();

router.get("/api/scrapeCarousell", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const response = await scraperApiClient.get(url);
    const $ = cherrio.load(response);
    const scraper = await WebScraping.findOne({ where: { name: "carousell" } });
    console.log(scraper);
    console.log(scraper.title);
    if (scraper === null) {
      return res
        .status(422)
        .send({ status: 0, msg: "No such site in database" });
    } else {
      const image = $(scraper.landing_image).attr("src");
      const title = $(scraper.title).text();
      const fullPrice = $(scraper.price).text();
      const currency = fullPrice.substring(0, 2);
      const price = fullPrice.substring(2);

      const moreImages = [];

      $(scraper.more_images).each(function (index, element) {
        moreImages.push($("img", element).attr("src"));
      });

      const description = $(scraper.description).text();

      const category = [];

      $(scraper.category).each(function (index, element) {
        category.push($(element).text());
      });

      const data = {
        image: image !== undefined ? image : "",
        title,
        currency,
        sourcePrice:
          isNaN(price) || price === undefined || price === null ? 0 : price,
        stars: "",
        source: "carousell",
        linkUrl: url,
        moreImages,
        description,
        category: category[0],
        subcategory: category.splice(1),
        specifications: [],
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

// router.get("/api/scrapeCarousell", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cherrio.load(response);

//     const image = $(".P2llUzsDMi._14ECgRVNZW").attr("src");
//     const title = $(
//       "._1GAn3pVd1I.Frxwxbenkw._3C_Fa-ysxa._1nrUVoahqT._3p8xgvgEFA._34Zhroog8h"
//     ).text();
//     const fullPrice = $(
//       ".K6KjbGieCG.Frxwxbenkw._1ND5d1keXw._1nrUVoahqT._3p8xgvgEFA._2ll7xsQl7v"
//     ).text();
//     const currency = fullPrice.substring(0, 2);
//     const price = fullPrice.substring(2);

//     const moreImages = [];

//     $(
//       "._3dxOPpKVs8._2Hl0nzGgOH._3KEDnFP0dp._3fMG9eYX3d._1snUbgX8Aa._3JonmjrVMk"
//     ).each(function (index, element) {
//       moreImages.push($("img", element).attr("src"));
//     });

//     const description = $(
//       "._1gJzwc_bJS._2rwkILN6KA.Rmplp6XJNu._2rtT6NUaXc._2m1WFlGyTw.lqg5eVwdBz._19l6iUes6V.OEczB0h3_O._3k5LISAlf6"
//     ).text();

//     const category = [];

//     $(
//       "._1gJzwc_bJS._2rwkILN6KA.Rmplp6XJNu.mT74Grr7MA.nCFolhPlNA.lqg5eVwdBz._19l6iUes6V.x36Kyh_id8._1FlUd6O1SG._30RANjWDIv"
//     ).each(function (index, element) {
//       category.push($(element).text());
//     });

//     const data = {
//       image: image !== undefined ? image : "",
//       title,
//       currency,
//       sourcePrice: price,
//       stars: "",
//       source: "carousell",
//       linkUrl: url,
//       moreImages,
//       description,
//       category: category[0],
//       subcategory: category.splice(1),
//       specifications: [],
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
