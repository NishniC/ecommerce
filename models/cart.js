const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;



const cartSchema = new Schema({
  productId: {
    type: Array,
    ref: "Product", 
    required: true,
  },
  userId: {
    type: String,
    ref: "User", 
    required: true,
  }
});

module.exports = mongoose.model("Cart", cartSchema);