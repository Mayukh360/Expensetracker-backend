const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sequelize = require("./database/database");
const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");
const Order = require("./models/order");

const paymentController = require("./controller/paymentcontroller");
const authController = require("./controller/authcontroller"); 

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

// app.get("/showleaderboard", async (req, res) => {
//   try {
//     // Fetch required attributes (name and id) from the User table
//     const users = await User.findAll({
//       attributes: ["name", "id"],
//     });

//     // Initialize an array to store user expenses
//     const userExpenses = [];

//     // Iterate over each user and calculate their total expenses
//     for (const user of users) {
//       // Find all products associated with the user and only retrieve the amount attribute
//       const products = await Product.findAll({

//         attributes: ["userId",sequelize.fn('sum', sequelize.col('product.amount')),'totalExpenses'],
//       });

//       // Calculate the total expenses for the user
//       // const totalExpenses = products.reduce(
//       //   (sum, product) => sum + product.amount,
//       //   0
//       // );

//       // Push user name and total expenses to the userExpenses array
//       userExpenses.push({ name: user.name, totalExpenses });
//     }

//     // Sort the userExpenses array in descending order of total expenses
//     const leaderboard = userExpenses.sort(
//       (a, b) => b.totalExpenses - a.totalExpenses
//     );

//     res.json({ leaderboard });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get("/showleaderboard", async (req, res) => {
//   try {
//     // Fetch required attributes (name and id) from the User table
//     const users = await User.findAll({
//       attributes: ["name", "id"],
//     });

//     // Initialize an array to store user expenses
//     const userExpenses = [];

//     // Iterate over each user and calculate their total expenses
//     for (const user of users) {
//       // Find all products associated with the user and only retrieve the amount attribute
//       const products = await Product.findAll({
//         where: { userId: user.id },
//         attributes: [
//           "userId",
//           [sequelize.fn("sum", sequelize.col("amount")), "totalExpenses"],
//         ],
//         group: ["userId"],
//       });

//       // Get the total expenses for the user (if any)
//       const totalExpenses =
//         products.length > 0 ? products[0].dataValues.totalExpenses : 0;

//       // Push user name and total expenses to the userExpenses array
//       userExpenses.push({ name: user.name, totalExpenses });
//     }

//     // Sort the userExpenses array in descending order of total expenses
//     const leaderboard = userExpenses.sort(
//       (a, b) => b.totalExpenses - a.totalExpenses
//     );

//     res.json({ leaderboard });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get("/showleaderboard", async (req, res) => {
//   try {
//     // Fetch required attributes (name and id) from the User table
//     const users = await User.findAll({
//       attributes: [
//         "name",
//         "id",
//         // [sequelize.fn("sum", sequelize.col("products.amount")), "totalExpenses"],
//         [
//           sequelize.fn(
//             "COALESCE",
//             sequelize.fn("sum", sequelize.col("products.amount")),
//             0
//           ),
//           "totalExpenses",
//         ],
//       ],
//       include: [
//         {
//           model: Product,
//           attributes: [],
//         },
//       ],
//       group: ["id"], // Use the name of the model's column here
//     });

//     // Sort the user array in descending order of total expenses
//     const leaderboard = users.sort(
//       (a, b) => b.dataValues.totalExpenses - a.dataValues.totalExpenses
//     );

//     res.json({ leaderboard });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
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


app.get("/getData", expensecomtroller.getAllProducts);
app.post("/getData", expensecomtroller.createProduct);
app.put("/addData/:id", expensecomtroller.updateProduct);
app.delete("/getData/:id", expensecomtroller.deleteProduct);
app.post("/signup", authController.signup);
app.post("/login", authController.login);






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
