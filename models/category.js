const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, "Category is required"],
    validate: {
      validator: (value) => nameValidator.test(value),
      message: "Category Name should only contain letters.",
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  subcategories: [String],
});

module.exports = mongoose.model("Category", categorySchema);
