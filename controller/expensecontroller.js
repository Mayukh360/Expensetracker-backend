
const Product = require("../models/product");
const User=require("../models/user")
const sequelize=require('../database/database')

// const ITEMS_PER_PAGE = 5;

const getAllProducts = async (req, res) => {
  const { page, limit } = req.query;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;
  console.log("PAGE",page)
  try {
    const userId = req.user.id;
    const { count, rows: expenses } = await Product.findAndCountAll({
      where: { userId },
      limit: parseInt(limit),
      offset,
    });

    res.json({ expenses, totalItems: count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createProduct = async (req, res) => {
  const t = await sequelize.transaction(); // Begin transaction
  console.log(req.body);
  try {
    const { description, amount, category} = req.body;
    const product = await req.user.createProduct(
      {
        description,
        amount,
        category
      },
      { transaction: t } 
    );

    // Fetch the user associated with the product
    const user = await User.findByPk(req.user.id, { transaction: t });

    // Calculate the new totalexpense
    user.totalexpense = (user.totalexpense || 0) + parseFloat(amount);

    await user.save({ transaction: t }); // Save the updated user inside the transaction

    await t.commit(); // Commit the transaction

    res.json(product);
  } catch (error) {
    console.log(error);
    await t.rollback(); // Rollback the transaction in case of an error
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  const t = await sequelize.transaction(); // Begin transaction
  console.log(req.params);
  console.log(req.body);
  try {
    const { id } = req.params;
    const { description, amount, category, totalexpense } = req.body;
    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      await t.rollback(); // Rollback the transaction if the product is not found
      return;
    }
    const oldAmount = product.amount; // getting old amount
    product.description = description;
    product.amount = amount;
    product.category = category;
    await product.save({ transaction: t });

    // Fetch the user associated with the product
    const user = await User.findByPk(product.userId, { transaction: t });

    // Calculate the new totalexpense
    user.totalexpense = (user.totalexpense || 0) - oldAmount + parseFloat(amount);

    await user.save({ transaction: t }); // Save the updated user inside the transaction

    await t.commit(); // Commit the transaction

    res.json(product);
  } catch (error) {
    console.log(error);
    await t.rollback(); // Rollback the transaction in case of an error
    res.status(500).json({ error: 'Internal server error' });
  }
};



const deleteProduct = async (req, res) => {
  const t = await sequelize.transaction(); // Begin transaction
  console.log(req.body);
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      await t.rollback(); // Rollback the transaction if the product is not found
      return;
    }

    const amount = product.amount;

    // Fetch the user associated with the product
    const user = await User.findByPk(product.userId, { transaction: t });

    // Update the totalexpense in User table
    user.totalexpense = (user.totalexpense || 0) - parseFloat(amount);

    await user.save({ transaction: t }); // Save the updated user inside the transaction

    await product.destroy({ transaction: t }); // Delete the product inside the transaction

    await t.commit(); // Commit the transaction

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    await t.rollback(); // Rollback the transaction in case of an error
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};