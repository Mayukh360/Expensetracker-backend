const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken");
const Order = require("../models/order");
const User = require("../models/user");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (req, res) => {
  const token = req.headers.authorization;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    // Get the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: 1000, // Example amount
      currency: "INR", // Example currency
    });

    const orderId = razorpayOrder.id;

    // Save the orderId and keyId to the database or perform necessary actions
    const order = await Order.create({
      paymentid: "", // Initially empty, It will be updated when the payment will be successful
      orderid: orderId,
      status: "pending",
      userId: user.id, // Associate the order with the user
    });

    const keyId = razorpayOrder.key_id;

    res.json({ keyId, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

const updateTransaction = async (req, res) => {
  const { orderId } = req.params;
  const { paymentId } = req.body;

  try {
    // Finding the order by orderId
    const order = await Order.findOne({ where: { orderid: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Updating the order with paymentId and status as "completed"
    order.paymentid = paymentId;
    order.status = "completed";
    await order.save();

    // Updating the user's isPremium field to true
    const user = await User.findByPk(order.userId);
    if (user) {
      user.isPremium = true;
      await user.save();
    }

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
};

module.exports = {
  createRazorpayOrder,
  updateTransaction,
};
