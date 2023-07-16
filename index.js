const express = require("express");
const jwt = require("jsonwebtoken");

const sequelize = require("./database/database");
const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");
const Order = require("./models/order");
const paymentController = require("./controller/paymentcontroller");
const authController = require("./controller/authcontroller");
require("dotenv").config();
const Sib = require("sib-api-v3-sdk");

// Configure Sendinblue API client with your API key
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.API_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi();
const sender = { email: "mayukhchatterjee722@gmail.com" };

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const token = req.headers.authorization;
  console.log(token);
  if (token) {
    const decodedToken = jwt.verify(token, "abcdxyztrsdgpjslyytfdcbf");
    const userId = decodedToken.userId;
    console.log("USERID", userId);
    User.findByPk(userId)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((err) => {
        console.log(err);
        next();
      });
  } else {
    next();
  }
});

app.get("/getData", expensecomtroller.getAllProducts);
app.post("/getData", expensecomtroller.createProduct);
app.put("/addData/:id", expensecomtroller.updateProduct);
app.delete("/getData/:id", expensecomtroller.deleteProduct);
app.post("/signup", authController.signup);
app.post("/login", authController.login);

app.post("/razorpay/transaction", async (req, res) => {
  const token = req.headers.authorization;
  const decodedToken = jwt.verify(token, "abcdxyztrsdgpjslyytfdcbf");
  const userId = decodedToken.userId;

  try {
    const { keyId, orderId } = await paymentController.createRazorpayOrder(
      userId
    );

    res.json({ keyId, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/razorpay/transaction/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { paymentId } = req.body;

  try {
    const message = await paymentController.updateTransaction(
      orderId,
      paymentId
    );

    res.json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/showleaderboard", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["name", "totalexpense"], // Include only name and totalExpenses attributes
    });

    res.json({ leaderboard: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.post("/forgotpassword", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);

    // Send the dummy email to the specified email address
    const recievers =[ { email: email }];

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: recievers,
      subject: "Forgot Password",
      textContent: "This is dummy email for reset password",
    });
    console.log(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


User.hasMany(Product);
Product.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

sequelize
  .sync()
  .then((result) => {
    console.log("Database synced");
    return User.findByPk(1);
  })
  .then((user) => {
    // console.log(user);
    app.listen(3000, () => {
      console.log("Server running");
    });
  })
  .catch((err) => {
    console.log(err);
  });
