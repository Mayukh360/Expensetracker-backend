const Razorpay = require("razorpay");
const Order = require("../models/order");
const User = require("../models/user");

const razorpay = new Razorpay({
  key_id: "rzp_test_rjwCZBuYXmqIln",
  key_secret: "WXUI0e1zL8uzm6f5fjzhMt41",
});

const createRazorpayOrder = async (userId) => {
  try {
    // Get the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
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

    return { keyId, orderId };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create Razorpay order");
  }
};

const updateTransaction = async (orderId, paymentId) => {
  try {
    // Finding the order by orderId
    const order = await Order.findOne({ where: { orderid: orderId } });
    if (!order) {
      throw new Error("Order not found");
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

    return "Transaction updated successfully";
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update transaction");
  }
};

module.exports = {
  createRazorpayOrder,
  updateTransaction,
};
