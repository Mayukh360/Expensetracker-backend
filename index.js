const express = require("express");
const jwt = require("jsonwebtoken");

const sequelize = require("./database/database");
const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");
const Order = require("./models/order");
const Request = require("./models/forgotpassword");
const paymentController = require("./controller/paymentcontroller");
const authController = require("./controller/authcontroller");
require("dotenv").config();
const Sib = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure Sendinblue API client with your API key
const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
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

    // Find the user by email in the User table
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a new requestId (UUID) for the forgot password request
    const requestId = uuidv4();

    // Save the request details in the database with the correct userId
    await Request.create({
      id: requestId,
      isActive: true,
      userId: user.id,
    });

    // Generate the reset URL with the requestId and userId
    const resetURL = `http://localhost:3000/password/resetpassword/${requestId}/${user.id}`;

    // Send the reset password email to the specified email address
    const receivers = [{ email: email }];

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: "Forgot Password",
      textContent: `Click on the link to reset your password: ${resetURL}`,
    });

    console.log(response);
    res.json({ message: "Reset password email sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/password/resetpassword/:requestId/:userId", async (req, res) => {
  const { requestId, userId } = req.params;
  try {
    // Check if the request exists in the database and isActive is true
    const request = await Request.findOne({
      where: {
        id: requestId,
        isActive: true,
      },
    });

    if (!request || request.userId !== parseInt(userId)) {
      return res
        .status(400)
        .json({ error: "Invalid or expired reset request" });
    }

    res.status(200).send(`<html>
      <form action="/password/updatepassword/${userId}/${requestId}" method="get">
        <label for="newPassword">Enter New Password</label>
        <input name="newPassword" type="password" required></input>
        <button type="submit">Reset Password</button>
      </form>
    </html>`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Internal server error while sending form" });
  }
});

app.get("/password/updatepassword/:userId/:requestId", async (req, res) => {
  const { userId, requestId } = req.params;
  const { newPassword } = req.query;
  console.log('FINAL', userId, newPassword)

  try {
    // Find the user by userId (you can also use JWT token to get userId)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's password (Don't forget to encrypt the password)
    user.password = newPassword;
    await user.save();

    // Update the request's isActive status to false
    const request = await Request.findOne({
      where: {
        id: requestId,
        userId: user.id,
      },
    });

    if (!request) {
      return res.status(400).json({ error: "Invalid or expired reset request" });
    }

    // Update the request's isActive status to false
    request.isActive = false;
    await request.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error updating password" });
  }
});


User.hasMany(Product);
Product.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Request);
Request.belongsTo(User);

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
