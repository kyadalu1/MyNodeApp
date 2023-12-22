const express = require("express");
const http = require("http");
const fileUpload = require("express-fileupload");
const socketio = require("socket.io");
const admin = require("firebase-admin");
const serviceAccount = require("./my-287408-firebase-adminsdk-zr72g-1234.json");
require("./models/CardRawScrape");
require("./models/WebScraping");
const Chat = require("./models/Chat");

const amazonScrapperRoute = require("./routes/amazonScrapperRoute");
const flipkartScrapperRoute = require("./routes/flipkartScrapperRoute");
const eBayScrapperRoute = require("./routes/eBayScrapperRoute");
const lazadaScrapperRoute = require("./routes/lazadaScrapperRoute");
const shopeeRoute = require("./routes/shopeeRoute");
const carousellRoute = require("./routes/carousellRoute");
const tokopediaRoute = require("./routes/tokopediaRoute");
const chatRoute = require("./routes/chat/ChatRoute");
const cardRoute = require("./routes/card/CardRoute");
const iosPurchaseValidationRoute = require("./routes/iOSPurchaseValidation");

const { addUser, removeUser } = require("./util/User");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//Cors Handling
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET");
    return res.status(200).json({});
  }
  next();
});

app.use(fileUpload());
app.use(amazonScrapperRoute);
app.use(flipkartScrapperRoute);
app.use(eBayScrapperRoute);
app.use(lazadaScrapperRoute);
app.use(shopeeRoute);
app.use(carousellRoute);
app.use(tokopediaRoute);
app.use(chatRoute);
app.use(cardRoute);
app.use(iosPurchaseValidationRoute);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

io.on("connection", (socket) => {
  socket.on("userjoin", (email) => {
    addUser({ id: socket.id, email });
    socket.broadcast.emit("userjoined", email);
  });

  socket.on(
    "sendChat",
    async (message_id, message, send_by, message_type, sendersName) => {
      try {
        const chatMessage = await Chat.create({
          message_id,
          message,
          send_by,
          message_type,
          created_date: new Date().toISOString(),
        });
        io.emit("receiveChat", {
          status: 1,
          message: {
            messageId: chatMessage.message_id,
            message: Buffer.from(chatMessage.message).toString(),
            sendBy: chatMessage.send_by,
            messageType: chatMessage.message_type,
            createdDate: chatMessage.created_date,
            chatHistoryId: chatMessage.chat_history_id,
          },
        });

        var body = "";
        if (
          message_type === "text" ||
          message_type === "makeOffer" ||
          message_type === "declineOffer" ||
          message_type === "acceptOffer"
        ) {
          body = chatMessage.message;
        } else if (message_type === "deal_place_time") {
          body = `Lets meet at ${
            JSON.parse(chatMessage.message).placeName
          } on ${JSON.parse(chatMessage.message).date}`;
        } else if (message_type === "image") {
          body = "Image";
        } else if (message_type === "location") {
          body = `${sendersName} has shared a location`;
        } else if (message_type === "live_location") {
          body = `${sendersName} is sharing live location with you`;
        } else if (message_type === "productDelivered") {
          body = `${sendersName} is asking for product deliver confirmation`;
        }

        var message = {
          data: {
            title: `Message from ${sendersName}`,
            message: body,
          },
          token: "my_token",
        };
        await admin.messaging().send(message);
      } catch (err) {
        io.emit("receiveChat", { status: 0, message: `${err}` });
      }
    }
  );

  socket.on(
    "sendLiveLocation",
    async (message_id, message, sendBy, id, message_type) => {
      try {
        const chatMessage = await Chat.findByPk(id);
        chatMessage.message = message;
        await chatMessage.save();
        io.emit("receiveLiveLocation", {
          status: 1,
          message: {
            messageId: chatMessage.message_id,
            message: Buffer.from(chatMessage.message).toString(),
            sendBy: chatMessage.send_by,
            messageType: chatMessage.message_type,
            createdDate: chatMessage.created_date,
            chatHistoryId: chatMessage.chat_history_id,
          },
        });
      } catch (err) {
        io.emit("receiveLiveLocation", {
          status: 0,
          message: "Fail to deliver msg",
        });
      }
    }
  );

  socket.on("stopLiveLocationShare", async (message_id, message, id) => {
    try {
      const chatMessage = await Chat.findByPk(id);
      chatMessage.message = message;
      chatMessage.message_type = "location";
      await chatMessage.save();
      io.emit("deleteLiveLocation", {
        chatHistoryId: id,
      });

      io.emit("receiveChat", {
        status: 1,
        message: {
          messageId: chatMessage.message_id,
          message: Buffer.from(chatMessage.message).toString(),
          sendBy: chatMessage.send_by,
          messageType: chatMessage.message_type,
          createdDate: chatMessage.created_date,
          chatHistoryId: chatMessage.chat_history_id,
        },
      });
    } catch (err) {
      io.emit("receiveChat", {
        status: 0,
        message: "Fail to deliver msg",
      });
    }
  });

  socket.on(
    "acceptDeclineTimeDateForPlace",
    async (chatHistoryId, message, senderName) => {
      try {
        const chatMessage = await Chat.findByPk(chatHistoryId);
        //Dont update the existing message as it causes issues because the rest api created by tanvi required the last chat history id which dont considers the updated msg and it just pass nulls so delete the original msg first and create new msg
        const newChatMessage = await Chat.create({
          message_id: chatMessage.message_id,
          message,
          send_by: chatMessage.send_by,
          message_type: chatMessage.message_type,
          created_date: new Date().toISOString(),
        });
        await chatMessage.destroy();
        io.emit("receiveChat", {
          status: 1,
          message: {
            messageId: newChatMessage.message_id,
            message: Buffer.from(newChatMessage.message).toString(),
            sendBy: newChatMessage.send_by,
            messageType: newChatMessage.message_type,
            createdDate: newChatMessage.created_date,
            chatHistoryId: newChatMessage.chat_history_id,
          },
        });
        var message = {
          data: {
            title: `Message from ${senderName}`,
            message: `${senderName} has responded to place time details`,
          },
          token: "toekn",
        };
        await admin.messaging().send(message);
      } catch (err) {
        io.emit("receiveChat", {
          status: 0,
          message: "Fail to deliver msg",
        });
      }
    }
  );

  socket.on(
    "productNotDelivered",
    async (chatHistoryId, message, senderName) => {
      try {
        const chatMessage = await Chat.findByPk(chatHistoryId);
        //Dont update the existing message as it causes issues because the rest api created by tanvi required the last chat history id which dont considers the updated msg and it just pass nulls so delete the original msg first and create new msg
        const newChatMessage = await Chat.create({
          message_id: chatMessage.message_id,
          message,
          send_by: chatMessage.send_by,
          message_type: chatMessage.message_type,
          created_date: new Date().toISOString(),
        });
        await chatMessage.destroy();
        io.emit("receiveChat", {
          status: 1,
          message: {
            messageId: newChatMessage.message_id,
            message: Buffer.from(newChatMessage.message).toString(),
            sendBy: newChatMessage.send_by,
            messageType: newChatMessage.message_type,
            createdDate: newChatMessage.created_date,
            chatHistoryId: newChatMessage.chat_history_id,
          },
        });
        var message = {
          data: {
            title: `Message from ${senderName}`,
            message: `${senderName} has responded to product delivery status`,
          },
          token: "mytoken",
        };
        await admin.messaging().send(message);
      } catch (err) {
        io.emit("receiveChat", {
          status: 0,
          message: "Fail to deliver msg",
        });
      }
    }
  );

  socket.on("disconnectUser", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.emit("disconnected", user.email + " left");
    }
  });
});

// sequelize
//   .sync()
//   .then((result) => {
//     console.log("Working");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

const PORT = process.env.PORT || 4000;

server.listen(PORT, async () => {
  try {
    // await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  console.log(`Listening on ${PORT}`);
});
