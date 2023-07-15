const Product = require("../models/product");
const User=require("../models/user")

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createProduct = async (req, res) => {
    console.log(req.body)
  try {
    const { description, amount, category,totalexpense } = req.body;
    const product = await req.user.createProduct({
      description,
      amount,
      category
    });

    const user = await User.findByPk(req.user.id);
    user.totalexpense = (user.totalexpense || 0) + parseFloat(amount); // Add the expense amount to the total or initialize to 0 if null
    await user.save(); // Save the updated user

    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  console.log(req.params)
  console.log(req.body)
  try {
    const { id } = req.params;
    const {  description, amount, category,totalexpense } = req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const oldAmount = product.amount; // getting old amount
    product.description = description;
    product.amount = amount;
    product.category = category;
    await product.save();

     // Fetch the user associated with the product
     const user = await User.findByPk(product.userId);

     // Calculate the new totalexpense
     user.totalexpense = (user.totalexpense || 0) - oldAmount + parseFloat(amount);
 
     await user.save(); // Save the updated user

    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const deleteProduct = async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};