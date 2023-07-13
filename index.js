const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sequelize = require("./database/database");
const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");
const Order=require("./models/order")
const Razorpay = require("razorpay");

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

const razorpay = new Razorpay({
  key_id: "rzp_test_rjwCZBuYXmqIln",
  key_secret: "WXUI0e1zL8uzm6f5fjzhMt41",
});

app.post("/razorpay/transaction", async (req, res) => {
  const token = req.headers.authorization;
  const decodedToken = jwt.verify(token, "abcdxyztrsdgpjslyytfdcbf");
  const userId = decodedToken.userId;

  try {
    // Get the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: 1000, // Example amount
      currency: "INR", // Example currency
      // Add other necessary parameters for the transaction
    });

    const orderId = razorpayOrder.id;

    // Save the orderId and keyId to the database or perform necessary actions
    const order = await Order.create({
      paymentid: "", // Initially empty, will be updated later
      orderid: orderId,
      status: "pending",
      userId: user.id, // Associate the order with the user
    });

    const keyId = razorpayOrder.key_id;

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
    // Find the order by orderId
    const order = await Order.findOne({ where: { orderid: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the order with paymentId and status as "completed"
    order.paymentid = paymentId;
    order.status = "completed";
    await order.save();

     // Update the user's isPremium field to true
     const user = await User.findByPk(order.userId);
     if (user) {
       user.isPremium = true;
       await user.save();
     }

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getData", expensecomtroller.getAllProducts);
app.post("/getData", expensecomtroller.createProduct);
app.put("/addData/:id", expensecomtroller.updateProduct);
app.delete("/getData/:id", expensecomtroller.deleteProduct);

// *** For SignUp ***
app.post("/signup", async (req, res) => {
  console.log("SIGN", req.body);
  const { name, email, password } = req.body;

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isPremium: false, 
    });

    // Generate a JWT token for the new user
    const token = jwt.sign(
      { userId: newUser.id, name: newUser.name },
      "abcdxyztrsdgpjslyytfdcbf"
    );

    res.json({ token, userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// *** Login ***
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user in the database (using  Sequelize model)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email" });
    }

    // Compare the provided password with the hashed password
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      "abcdxyztrsdgpjslyytfdcbf"
    );

    // Return the token and userId in the response
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error(error);
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
