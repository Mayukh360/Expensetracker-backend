const Express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sequelize = require("./database/database");
// const expensecomtroller = require("./controller/expensecontroller");
const cors = require("cors");
const Product = require("./models/product");
const User = require("./models/user");

const app = Express();
app.use(cors());
app.use(Express.json());

app.use((req, res, next) => {
  // console.log("REq",req)
  const token = req.headers.authorization;
  console.log(token);
  if (token) {
    const decodedToken = jwt.verify(token, "your-secret-key");
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

// app.get("/getData", expensecomtroller.getAllProducts);
// app.post("/getData", expensecomtroller.createProduct);
// app.put("/addData/:id", expensecomtroller.updateProduct);
// app.delete("/getData/:id", expensecomtroller.deleteProduct);

// *** For SignUp ***
app.post("/signup", (req, res) => {
  console.log("SIGN", req.body);
  const { name, email, password } = req.body;

  // Check if the email already exists in the database
  User.findOne({ where: { email } })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          // Create a new user with the hashed password
          User.create({ name, email, password: hashedPassword })
            .then((newUser) => {
              // Generate a JWT token for the new user
              const token = jwt.sign(
                { userId: newUser.id, name: newUser.name },
                "your-secret-key",
                { expiresIn: "1h" }
              );

              res.json({ token, userId: newUser.id });
            })
            .catch((error) => {
              console.error(error);
              res.status(500).json({ error: "Failed to create user" });
            });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// *** Login ***
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Find the user in the database (using your Sequelize model)
  User.findOne({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Invalid email" });
      }

      // Compare the provided password with the hashed password
      bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (!result) {
            return res.status(401).json({ error: "Invalid password" });
          }

          // Generate a JWT token
          const token = jwt.sign(
            { userId: user.id, name: user.name },
            "your-secret-key",
            {
              expiresIn: "1h", // Token expiration time
            }
          );

          // Return the token and userId in the response
          res.json({ token, userId: user.id });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
});

User.hasMany(Product);
Product.belongsTo(User);

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
