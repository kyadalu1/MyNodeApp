const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { Op } = require("sequelize");

const Chat = require("../../models/Chat");

const upload = multer();
const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: "mykey",
  secretAccessKey: "mysecret",
});

router.post("/api/createChat", upload.none(), async (req, res) => {
  try {
    const chat = await Chat.create({
      message_id: 13,
      message: "Hello",
      send_by: 3376,
      message_type: "text",
      created_date: new Date(Date.now()).toISOString(),
    });
    return res.send({
      status: 1,
      msg: "Success",
      chat,
    });
  } catch (err) {
    return res.send({
      status: 0,
      msg: "Fail",
      err,
    });
  }
});

router.get("/api/chats", upload.none(), async (req, res) => {
  try {
    const { cardId, from, to } = req.query;
    const ids = [from, to];
    const chats = await Chat.findAll({
      where: {
        cardId: cardId,
        from: { [Op.in]: ids },
        to: { [Op.in]: ids },
      },
    });
    return res.send({
      status: 1,
      msg: "Success",
      chats,
    });
  } catch (err) {
    return res.send({
      status: 0,
      msg: "Fail",
    });
  }
});

router.post("/api/chatImage", async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.files.file;
    const key = `${userId}/${uuidv4()}.png`;

    const params = {
      Bucket: "my-images",
      Key: key,
      Body: file.data,
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        return res.send({
          status: 0,
          msg: "Fail",
        });
      }
      return res.send({
        status: 1,
        msg: "Success",
        imageUrl: `${data.Location}`,
      });
    });
  } catch (err) {
    return res.send({
      status: 0,
      msg: "Fail",
      // err,
    });
  }
});

module.exports = router;
