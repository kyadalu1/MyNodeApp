const express = require("express");
const multer = require("multer");
const cheerio = require("cheerio");
const axios = require("axios");
const WebScraping = require("../models/WebScraping");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const dayjs = require("dayjs");
const CardRawScrape = require("../models/CardRawScrape");

const sequelize = require("../util/database");
const scraperApiClient = require("scraperapi-sdk")("dsdsds");
const router = express.Router();
const upload = multer();

router.get("/api/scrapeAmazon", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const response = await scraperApiClient.get(url);
    const $ = cheerio.load(response);
    const scraper = await WebScraping.findOne({ where: { name: "amazon" } });
    console.log(scraper);
    console.log(scraper.title);
    if (scraper === null) {
      return res
        .status(422)
        .send({ status: 0, msg: "No such site in database" });
    } else {
      const image = $(scraper.landing_image).attr("data-old-hires");
      const title = $(scraper.title).text().replace(/\n/g, "");
      let currency;
      let price;
      if ($(scraper.price).text().indexOf(" ") >= 0) {
        const fullPrice = $(scraper.price).text().toString().split(/\s/g);
        price = fullPrice[2];
        currency = fullPrice[0];
      } else {
        const fullPrice = $(scraper.price).text();
        price = fullPrice.substring(2);
        currency = fullPrice.substring(0, 1);
      }
      const stars = $(`span[id=${scraper.stars}]`)
        .find("span > a > i > span")
        .text()
        .charAt(0);
      const description = $(scraper.description)
        .find("li > span")
        .text()
        .replace(/\n/g, "");
      const moreImages = [];
      $(scraper.more_images)
        .find("span > img")
        .each(function (index, element) {
          moreImages.push($(element).attr("src"));
        });
      const category = [];

      $(scraper.category).each(function (index, element) {
        category.push($(element).text().replace(/\n/g, "").replace(/\s/g, ""));
      });

      const specifications = [];
      $(scraper.specifications)
        .find("ul > li")
        .each(function (index, element) {
          specifications.push(
            $(element).text().replace(/\n/g, "").replace(/\s/g, "")
          );
        });

      const isValidPrice = parseFloat(price.replace(",", ""));

      const data = {
        image,
        title,
        sourcePrice:
          isNaN(isValidPrice) ||
          isValidPrice === undefined ||
          isValidPrice === null
            ? 0
            : isValidPrice,
        stars,
        description,
        moreImages,
        source: "amazon",
        linkUrl: url,
        currency,
        category: category[0],
        subcategory: category.splice(1),
        specifications,
      };
      console.log(data);
      const cardScrapeResponse = await CardRawScrape.create({
        link_url: data.linkUrl,
        raw_card: JSON.stringify(data),
        // raw_card: `{
        //   "image: "${image}",
        //   "title": "${title}",
        //   "sourcePrice": ${parseFloat(price.replace(",", ""))},
        //   "stars":"${stars}",
        //   "description":"${description}",
        //   "moreImages":[${moreImages.join().split(",")}],
        //   "source": "amazon",
        //   "linkUrl": "${url}",
        //   "currency": "${currency}",
        //   "category": "${category[0]}",
        //   "subcategory": [${category.splice(1).join().split(",")}],
        // "specifications":[${specifications.join().split(",")}]
        // }`,
        image: data.image,
        more_images: data.moreImages.toString(),
        description: data.description,
        title: data.title,
        category: data.category,
        specifications: data.specifications.toString(),
        // created_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        // modified_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        stars: data.stars,
        source: data.source,
        currency: data.currency,
        subcategory: data.subcategory.toString(),
      });
      // await sequelize
      //   .query(
      //     `INSERT INTO card_raw_scrape(link_url,raw_card,source_price,image,
      //   more_images,description,title,category,specifications,created_date,modified_date,
      //   stars,source,currency,subcategory)VALUES
      // (${data.linkUrl},${data},${data.sourcePrice},${data.image},${
      //       data.moreImages
      //     },${data.description},
      //   ${data.title},${data.category},${data.specifications},${dayjs().format(
      //       "YYYY-MM-DD HH:mm:ss"
      //     )},
      //   ${dayjs().format("YYYY-MM-DD HH:mm:ss")},${data.stars},${data.source},${
      //       data.currency
      //     },${data.subcategory});`
      //   )
      //   .catch(function (err) {
      //     console.log(JSON.stringify(err));
      //   });
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
    }
  } catch (e) {
    return res.status(422).send({ status: 0, msg: e.toString() });
  }
});

// router.get("/api/scrapeAmazon", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cheerio.load(response);
//     const image = $("#landingImage").attr("data-old-hires");
//     const title = $("#productTitle").text().replace(/\n/g, "");
//     let currency;
//     let price;
//     if ($("#priceblock_ourprice").text().indexOf(" ") >= 0) {
//       const fullPrice = $("#priceblock_ourprice")
//         .text()
//         .toString()
//         .split(/\s/g);
//       price = fullPrice[2];
//       currency = fullPrice[0];
//     } else {
//       const fullPrice = $("#priceblock_ourprice").text();
//       price = fullPrice.substring(2);
//       currency = fullPrice.substring(0, 1);
//     }
//     const stars = $('span[id="acrPopover"]')
//       .find("span > a > i > span")
//       .text()
//       .charAt(0);
//     const description = $(".a-unordered-list.a-vertical.a-spacing-mini")
//       .find("li > span")
//       .text()
//       .replace(/\n/g, "");
//     const moreImages = [];
//     $(".a-button-inner")
//       .find("span > img")
//       .each(function (index, element) {
//         moreImages.push($(element).attr("src"));
//       });
//     const category = [];

//     $(".a-link-normal.a-color-tertiary").each(function (index, element) {
//       category.push($(element).text().replace(/\n/g, "").replace(/\s/g, ""));
//     });

//     const specifications = [];
//     $(".content")
//       .find("ul > li")
//       .each(function (index, element) {
//         specifications.push(
//           $(element).text().replace(/\n/g, "").replace(/\s/g, "")
//         );
//       });

//     const data = {
//       image,
//       title,
//       sourcePrice: parseFloat(price.replace(",", "")),
//       stars,
//       description,
//       moreImages,
//       source: "amazon",
//       linkUrl: url,
//       currency,
//       category: category[0],
//       subcategory: category.splice(1),
//       specifications,
//     };
//     console.log(data);
//     await CardRawScrape.create({
//       link_url: data.linkUrl,
//       raw_card: JSON.stringify(data),
//       // raw_card: `{
//       //   "image: "${image}",
//       //   "title": "${title}",
//       //   "sourcePrice": ${parseFloat(price.replace(",", ""))},
//       //   "stars":"${stars}",
//       //   "description":"${description}",
//       //   "moreImages":[${moreImages.join().split(",")}],
//       //   "source": "amazon",
//       //   "linkUrl": "${url}",
//       //   "currency": "${currency}",
//       //   "category": "${category[0]}",
//       //   "subcategory": [${category.splice(1).join().split(",")}],
//       // "specifications":[${specifications.join().split(",")}]
//       // }`,
//       image: data.image,
//       more_images: data.moreImages.toString(),
//       description: data.description,
//       title: data.title,
//       category: data.category,
//       specifications: data.specifications.toString(),
//       // created_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
//       // modified_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
//       stars: data.stars,
//       source: data.source,
//       currency: data.currency,
//       subcategory: data.subcategory.toString(),
//     });
//     // await sequelize
//     //   .query(
//     //     `INSERT INTO card_raw_scrape(link_url,raw_card,source_price,image,
//     //   more_images,description,title,category,specifications,created_date,modified_date,
//     //   stars,source,currency,subcategory)VALUES
//     // (${data.linkUrl},${data},${data.sourcePrice},${data.image},${
//     //       data.moreImages
//     //     },${data.description},
//     //   ${data.title},${data.category},${data.specifications},${dayjs().format(
//     //       "YYYY-MM-DD HH:mm:ss"
//     //     )},
//     //   ${dayjs().format("YYYY-MM-DD HH:mm:ss")},${data.stars},${data.source},${
//     //       data.currency
//     //     },${data.subcategory});`
//     //   )
//     //   .catch(function (err) {
//     //     console.log(JSON.stringify(err));
//     //   });
//     return res.status(200).send({
//       status: 1,
//       msg: "Success",
//       data,
//     });
//     // axios
//     //   .post(SAVE_RAW_CARD_URL, {
//     //     rawCard: JSON.stringify(data),
//     //   })
//     //   .then((saveRawCardResponse) => {
//     //     return res.status(200).send({
//     //       status: 1,
//     //       msg: "Success",
//     //       data,
//     //       cardScrapeId: saveRawCardResponse.data.cardScrapeId,
//     //     });
//     //   })
//     //   .catch((err) => {
//     //     return res.status(422).send({ status: 0, msg: err.toString() });
//     //   });
//   } catch (e) {
//     return res.status(422).send({ status: 0, msg: e.toString() });
//   }
// });

module.exports = router;
