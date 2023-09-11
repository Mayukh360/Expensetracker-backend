const express = require("express");
const jwt = require("jsonwebtoken");
const sequelize = require("./database/database");
const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");
const Order = require("./models/order");
const Request = require("./models/forgotpassword");
const Download = require("./models/downloadexpense");
const paymentController = require("./controller/paymentcontroller");
const authController = require("./controller/authcontroller");
const leaderboardController = require("./controller/leaderboardcontroller");
const requestHandler = require("./controller/requestcontroller");
const { download, alldownload } = require("./controller/downloadcontroller"); 
require("dotenv").config();
const helmet=require('helmet')
const compression=require('compression')


const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const token = req.headers.authorization;
  console.log(token);
  if (token) {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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
//controllers
app.use(helmet());
app.use(compression());
app.get("/getData", expensecomtroller.getAllProducts);
app.post("/getData", expensecomtroller.createProduct);
app.put("/addData/:id", expensecomtroller.updateProduct);
app.delete("/getData/:id", expensecomtroller.deleteProduct);
app.post("/signup", authController.signup);
app.post("/login", authController.login);
app.get("/showleaderboard", leaderboardController.showLeaderboard);
app.post("/razorpay/transaction", paymentController.createRazorpayOrder);
app.put("/razorpay/transaction/:orderId", paymentController.updateTransaction);
app.post("/forgotpassword", requestHandler.handleForgotPassword);
app.get(
  "/password/resetpassword/:requestId/:userId",
  requestHandler.handleResetPasswordForm
);
app.get(
  "/password/updatepassword/:userId/:requestId",
  requestHandler.handleUpdatePassword
);

app.get("/download", download);
app.get("/alldownload", alldownload);

//Associantions
User.hasMany(Product);
Product.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Request);
Request.belongsTo(User);

User.hasMany(Download);
Download.belongsTo(User);

sequelize
  .sync()
  .then((result) => {
    console.log("Database synced");
    return User.findByPk(1);
  })
  .then((user) => {
    // console.log(user);
    app.listen( process.env.PORT ||3000, () => {
      console.log("Server running");
    });
  })
  .catch((err) => {
    console.log(err);
  });
