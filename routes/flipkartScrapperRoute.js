const express = require("express");
const multer = require("multer");
const cheerio = require("cheerio");
const axios = require("axios");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("dsdssdsdds");
const CardRawScrape = require("../models/CardRawScrape");
const WebScraping = require("../models/WebScraping");

const router = express.Router();
const upload = multer();

router.get("/api/scrapeFlipkart", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const response = await scraperApiClient.get(url);
    const $ = cheerio.load(response);

    const scraper = await WebScraping.findOne({ where: { name: "flipkart" } });
    console.log(scraper);
    console.log(scraper.title);
    if (scraper === null) {
      return res
        .status(422)
        .send({ status: 0, msg: "No such site in database" });
    } else {
      console.log(scraper.title);
      const image = $(scraper.landing_image).attr("src");
      const title = $(scraper.title).text();
      const fullPrice = $(scraper.price).text();
      const currency = fullPrice.substring(0, 1);
      const price = fullPrice.substring(1);
      const stars = parseInt($(scraper.stars).text());
      const description = $(scraper.description).text();

      const category = [];
      $(scraper.category).each(function (index, element) {
        category.push($(element).text().replace(/\n/g, "").replace(/\s/g, ""));
      });

      const specifications = [];
      $(scraper.specifications).each(function (index, element) {
        specifications.push(
          $("._3-wDH3.col.col-3-12", element).text() +
            ":" +
            $("._2k4JXJ.col.col-9-12", element).text()
        );
      });
      const data = {
        image,
        title,
        sourcePrice:
          isNaN(price) || price === undefined || price === null ? 0 : price,
        stars: stars !== undefined && !isNaN(stars) ? stars.toString() : "0",
        description,
        moreImages: [],
        source: "flipkart",
        linkUrl: url,
        currency,
        category: category[1],
        subcategory: category.splice(2),
        specifications,
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

// router.get("/api/scrapeFlipkart", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cheerio.load(response);

//     const image = $("._2r_T1I._396QI4").attr("src");
//     const title = $(".B_NuCI").text();
//     const fullPrice = $("._30jeq3._16Jk6d").text();
//     const currency = fullPrice.substring(0, 1);
//     const price = fullPrice.substring(1);
//     const stars = parseInt($("._3LWZlK._3uSWvT").text());
//     const description = $("._2GNeiG._2t27J6").text();

//     const category = [];
//     $("._3GIHBu").each(function (index, element) {
//       category.push($(element).text().replace(/\n/g, "").replace(/\s/g, ""));
//     });
//     const moreImages = [];
//     // console.log("1");
//     // console.log(
//     //   $(".q6DClP")
//     //     .css("background-image")
//     //     .replace("url(", "")
//     //     .replace(")", "")
//     //     .replace(/\"/gi, "")
//     // );

//     // $(".q6DClP._2_B7hD").click(function () {
//     //   var bg = $(this).css("background-image");
//     //   bg = bg.replace("url(", "").replace(")", "").replace(/\"/gi, "");
//     //   moreImages.push(bg);
//     // });

//     const specifications = [];
//     // $("._3_6Uyw.row").each(function (index, element) {
//     //   specifications.push(
//     //     $("._3-wDH3.col.col-3-12", element).text() +
//     //       ":" +
//     //       $("._2k4JXJ.col.col-9-12", element).text()
//     //   );
//     // });
//     const data = {
//       image,
//       title,
//       sourcePrice: price,
//       stars: stars !== undefined && !isNaN(stars) ? stars.toString() : "0",
//       description,
//       moreImages,
//       source: "flipkart",
//       linkUrl: url,
//       currency,
//       category: category[1],
//       subcategory: category.splice(2),
//       specifications,
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

// router.get("/api/scrapeFlipkart", upload.none(), async (req, res) => {
//   try {
//     const { url } = req.query;
//     const response = await scraperApiClient.get(url);
//     const $ = cheerio.load(response);

//     const image = $("._3togXc._3wp706").attr("src");
//     const title = $("._35KyD6").text();
//     const fullPrice = $("._1vC4OE._3qQ9m1").text();
//     const currency = fullPrice.substring(0, 1);
//     const price = fullPrice.substring(1);
//     const stars = parseInt($(".hGSR34").text());
//     const description = $("._2GNeiG._2t27J6").text();

//     const category = [];
//     $("._1HEvv0").each(function (index, element) {
//       category.push($(element).text().replace(/\n/g, "").replace(/\s/g, ""));
//     });

//     const specifications = [];
//     $("._3_6Uyw.row").each(function (index, element) {
//       specifications.push(
//         $("._3-wDH3.col.col-3-12", element).text() +
//           ":" +
//           $("._2k4JXJ.col.col-9-12", element).text()
//       );
//     });
//     const data = {
//       image,
//       title,
//       sourcePrice: price,
//       stars: stars !== undefined && !isNaN(stars) ? stars.toString() : "0",
//       description,
//       moreImages: [],
//       source: "flipkart",
//       linkUrl: url,
//       currency,
//       category: category[1],
//       subcategory: category.splice(2),
//       specifications,
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
