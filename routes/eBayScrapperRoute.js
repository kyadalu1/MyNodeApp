const express = require("express");
const multer = require("multer");
const cherrio = require("cheerio");
const axios = require("axios");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("dssddsdssd");
const WebScraping = require("../models/WebScraping");
const CardRawScrape = require("../models/CardRawScrape");
const router = express.Router();
const upload = multer();

router.get("/api/scrapeEbay", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const response = await scraperApiClient.get(url);
    const $ = cherrio.load(response);
    const scraper = await WebScraping.findOne({ where: { name: "Ebay" } });
    console.log(scraper);
    console.log(scraper.title);
    if (scraper === null) {
      return res
        .status(422)
        .send({ status: 0, msg: "No such site in database" });
    } else {
      const image = $(scraper.landing_image).attr("src");
      const title = $(scraper.title).text();
      const fullPrice = $(scraper.price).text().toString();
      const currency = "$";
      // fullPrice !== null && fullPrice !== undefined && fullPrice !== ""
      //   ? fullPrice.substring(0, 1)
      //   : "$";
      const price = "0";
      // fullPrice !== null && fullPrice !== undefined && fullPrice !== ""
      //   ? fullPrice.substring(1)
      //   : "0";
      const moreImages = [];
      $(scraper.more_images).each(function (index, element) {
        moreImages.push($("div img", element).attr("src"));
      });

      const description = [];
      $(scraper.description)
        .find("div > table > tbody")
        .each(function (index, element) {
          $("tr", element).each(function (index1, element1) {
            description.push(
              $("td", element1).text().replace(/\n/g, "").replace(/\s/g, "")
            );
          });
        });
      const category = [];

      $(scraper.category).each(function (index, element) {
        const text = $("span", element)
          .text()
          .replace(/\n/g, "")
          .replace(/\s/g, "");
        if (text !== "") {
          category.push(
            $("span", element).text().replace(/\n/g, "").replace(/\s/g, "")
          );
        }
      });
      const data = {
        image,
        title,
        sourcePrice: price,
        stars: "0",
        description: description.toString(),
        moreImages,
        source: "eBay",
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

// router.get("/api/scrapeEbay", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cherrio.load(response);
//     const image = $("#icImg").attr("src");
//     const title = $("#itemTitle").text();
//     const fullPrice = $(".cc-main-price").text().toString();
//     const currency = "$";
//     // fullPrice !== null && fullPrice !== undefined && fullPrice !== ""
//     //   ? fullPrice.substring(0, 1)
//     //   : "$";
//     const price = "0";
//     // fullPrice !== null && fullPrice !== undefined && fullPrice !== ""
//     //   ? fullPrice.substring(1)
//     //   : "0";
//     const moreImages = [];
//     $(".tdThumb").each(function (index, element) {
//       moreImages.push($("div img", element).attr("src"));
//     });

//     const description = [];
//     $("#viTabs_0_is")
//       .find("div > table > tbody")
//       .each(function (index, element) {
//         $("tr", element).each(function (index1, element1) {
//           description.push(
//             $("td", element1).text().replace(/\n/g, "").replace(/\s/g, "")
//           );
//         });
//       });
//     const category = [];

//     $(".thrd").each(function (index, element) {
//       const text = $("span", element)
//         .text()
//         .replace(/\n/g, "")
//         .replace(/\s/g, "");
//       if (text !== "") {
//         category.push(
//           $("span", element).text().replace(/\n/g, "").replace(/\s/g, "")
//         );
//       }
//     });
//     const data = {
//       image,
//       title,
//       sourcePrice: price,
//       stars: "0",
//       description: description.toString(),
//       moreImages,
//       source: "eBay",
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
