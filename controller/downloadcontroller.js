require("dotenv").config();
const AWS = require("aws-sdk");
const Download = require("../models/downloadexpense");
const Product = require("../models/product");

function uploadTos3(data, filename) {
  const BUCKET_NAME = process.env.BUCKET_NAME;
  const IAM_USER_KEY = process.env.IAM_USER_KEY;
  const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

  let s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    // Bucket: BUCKET_NAME
  });

  var params = {
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: data,
    ACL: "public-read",
  };
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, (err, s3response) => {
      if (err) {
        console.log("Something went wrong", err);
      } else {
        console.log("Success", s3response);
        resolve(s3response.Location);
      }
    });
  });
}

const download = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await Product.findAll({ where: { userId } });
    const stringifiedexpense = JSON.stringify(expenses);
    const filename = `Expenses${userId}/${new Date()}.txt`;
    const fileUrl = await uploadTos3(stringifiedexpense, filename);

    await Download.create({
      fileUrl: fileUrl,
      userId: userId,
    });

    res.status(200).json({ fileUrl, success: true });
  } catch (err) {
    console.log(err);
  }
};

const alldownload = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileUrls = await Download.findAll({ where: { userId } });

    res.status(200).json({ fileUrls, success: true });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  download,
  alldownload,
};
