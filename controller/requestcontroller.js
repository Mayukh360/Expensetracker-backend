const Request = require("../models/forgotpassword");
const User = require("../models/user");
const Sib = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const bcrypt = require("bcrypt");

// Configure Sendinblue API client with your API key
const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.API_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi();
const sender = { email: "mayukhchatterjee722@gmail.com" };

const sendResetPasswordEmail = async (email, requestId, userId) => {
  // Generate the reset URL with the requestId and userId
  const resetURL = `http://localhost:3000/password/resetpassword/${requestId}/${userId}`;

  // Send the reset password email to the specified email address
  const receivers = [{ email: email }];

  const response = await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Forgot Password",
    textContent: `Click on the link to reset your password: ${resetURL}`,
  });

  console.log(response);
};

const handleForgotPassword = async (req, res) => {
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

    // Send the reset password email
    await sendResetPasswordEmail(email, requestId, user.id);

    res.json({ message: "Reset password email sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleResetPasswordForm = async (req, res) => {
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
};

const handleUpdatePassword = async (req, res) => {
  const { userId, requestId } = req.params;
  const { newPassword } = req.query;
  console.log('FINAL', userId, newPassword)

  try {
    // Find the user by userId (you can also use JWT token to get userId)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password with the hashed password
    user.password = hashedPassword;
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
};

module.exports = {
  handleForgotPassword,
  handleResetPasswordForm,
  handleUpdatePassword,
};
