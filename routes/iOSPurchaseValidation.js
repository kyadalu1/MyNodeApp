const express = require("express");
const multer = require("multer");
const https = require("https");

const router = express.Router();
const upload = multer();

router.post("/api/iOSPurchaseValidation", upload.none(), async (req, res) => {
  try {
    var receiptJson = {};
    console.log("1");
    console.log(req.body);
    receiptJson["receipt-data"] = req.body;
    //Todo receiptJson["password"] you can get from click on features tab in app store
    //In App purchases tab on the left side you will see App-Specific Shared Secret button, Click it
    //Click Generate App specific Secret
    receiptJson["password"] = "b1d7c24d89ca425d8a47bbd015404963";
    const requestBody = JSON.stringify(receiptJson);

    const sandBoxRequestOptions = {
      hostname: "sandbox.itunes.apple.com",
      path: "/verifyReceipt",
      port: "443",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": requestBody.length,
      },
    };

    const requestOptions = {
      hostname: "buy.itunes.apple.com",
      path: "/verifyReceipt",
      port: "443",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": requestBody.length,
      },
    };

    const appStoreRequest = https.request(requestOptions, (res) => {
      let validatedReceiptData = "";
      res.on("data", (chunck) => {
        validatedReceiptData += chunck;
      });
      res.on("end", () => {
        let validatedReceiptJSON = JSON.parse(validatedReceiptData);
        if (validatedReceiptJSON.status === 21007) {
          sandBoxRequest.write(requestBody);
          sandBoxRequest.end();
        } else {
          return res.send({ status: 1, body: validatedReceiptData });
        }
      });
    });

    const sandBoxRequest = https.request(sandBoxRequestOptions, (res) => {
      let validatedReceiptData = "";
      res.on("data", (chunck) => {
        validatedReceiptData += chunck;
      });
      res.on("end", () => {
        return res.send({ status: 2, body: validatedReceiptData });
      });
    });

    appStoreRequest.write(requestBody);
    appStoreRequest.end();
  } catch (e) {
    return res.status(422).send({ status: 0, msg: e.toString() });
  }
});

module.exports = router;
