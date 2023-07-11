const Product = require("../models/product");

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
    const { description, amount, category } = req.body;
    const product = await req.user.createProduct({
      description,
      amount,
      category
    });
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  console.log(req.params)
  try {
    const { id } = req.params;
    const {  description, amount, category } = req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    product.description = description;
    product.amount = amount;
    product.category = category;
    await product.save();
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