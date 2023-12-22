const express = require("express");
const multer = require("multer");
const cherrio = require("cheerio");
const axios = require("axios");
const CardRawScrape = require("../models/CardRawScrape");
const { SAVE_RAW_CARD_URL } = require("../util/Constants");
const scraperApiClient = require("scraperapi-sdk")("123");

const router = express.Router();
const upload = multer();

router.get("/api/scrapeLazada", upload.none(), async (req, res) => {
  try {
    const { url } = req.query;
    const trimmedUrl = url.substring(0, url.indexOf(".html") + 5);
    const response = await scraperApiClient.get(trimmedUrl);
    const $ = cherrio.load(response);
    const scrapedData = JSON.parse(
      $("script[type='application/ld+json']")[0].children[0].data
    );
    const moreImages = [];
    let regex = /src\s*=\s*"(.*?)"/g;
    if (
      scrapedData.description !== null &&
      scrapedData.description !== undefined
    ) {
      [...scrapedData.description.matchAll(regex)].map(([a, link]) =>
        moreImages.push(link)
      );
    }

    let category = scrapedData.category.toString().includes(">")
      ? scrapedData.category.toString().split[0]
      : scrapedData.category.toString();
    $("#J_breadcrumb").each(function (index, element) {
      category = $("li span a span", element).text();
    });

    const isValidPrice = scrapedData.offers.lowPrice;
    const data = {
      image: `https:${scrapedData.image}`,
      title: scrapedData.name,
      sourcePrice:
        isNaN(isValidPrice) ||
        isValidPrice === undefined ||
        isValidPrice === null
          ? 0
          : isValidPrice.toString(),
      stars:
        scrapedData.aggregateRating !== undefined
          ? scrapedData.aggregateRating.ratingValue.toString()
          : "0",
      description:
        scrapedData.description !== null &&
        scrapedData.description !== undefined
          ? scrapedData.description
          : "",
      moreImages,
      source: "lazada",
      linkUrl: trimmedUrl,
      currency: scrapedData.offers.priceCurrency,
      category: category,
      subcategory: [
        scrapedData.category.toString().includes(">")
          ? scrapedData.category.toString().split[1]
          : "",
      ],
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
    console.log("here");
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
    console.log("herehhhhh");
    return res.status(422).send({ status: 0, msg: "Error getting data" });
  }
});

module.exports = router;
