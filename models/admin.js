const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;

const adminSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    validate: {
      validator: (value) => nameValidator.test(value),
      message: "First name should only contain letters.",
    },
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    validate: {
      validator: (value) => nameValidator.test(value),
      message: "Last name should only contain letters.",
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email is already registered"],
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Minimum password length is 6 characters"],
  },
  confirmpassword: {
    type: String,
    required: [true, "Confirm password is required"],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match.",
    },
  },
  role: {
    type: String,
    default: "admin",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
});



module.exports = mongoose.model("admin", adminSchema);
