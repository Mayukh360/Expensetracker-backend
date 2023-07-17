const User = require("../models/user");

const showLeaderboard = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["name", "totalexpense"], // Include only name and totalExpenses attributes
    });

    res.json({ leaderboard: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  showLeaderboard,
};
