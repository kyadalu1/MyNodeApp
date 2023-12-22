const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const axios = require("axios");

const upload = multer();
const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: "mykey",
  secretAccessKey: "mysecret",
});

router.post(
  "/api/uploadDashboardLandingImage",
  upload.none(),
  async (req, res) => {
    try {
      const { landingImageUrl } = req.body;
      console.log("1");
      const extension = "png";
      console.log("2");
      const key = `landingimage/${uuidv4()}.${extension}`;
      console.log("3");
      axios
        .get(encodeURI(landingImageUrl), {
          responseType: "arraybuffer",
        })
        .then((response) => {
          console.log("4");
          const params = {
            Bucket: "my-images",
            Key: key,
            Body: response.data,
          };
          console.log("5");
          s3.upload(params, function (err, data) {
            if (err) {
              console.log("6");
              return res.send({
                status: 0,
                msg: `${err}`,
              });
            } else {
              console.log("7");
              return res.send({
                status: 1,
                msg: "Success",
                imageUrl: `${data.Location}`,
              });
            }
          });
        })
        .catch((err) => {
          console.log("8");
          return res.send({
            status: 0,
            msg: `${err}`,
          });
        });
    } catch (err) {
      console.log("9");
      return res.send({
        status: 0,
        msg: "Fail to upload image to s3",
        err,
      });
    }
  }
);

module.exports = router;
