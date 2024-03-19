// const mongoose = require("../config/connection");
const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;

const userSchema = new Schema({
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
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Minimum password length is 8 characters"],
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
    default: "user",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  access: {
    type: Boolean,
    default: true,
  },
  date: { type: Date, default: Date.now },
  referralCode: { type: String, default: "as234" },
  referralLink: { type: String, default:null},
});
userSchema.statics.deleteUserById = async function (userId) {
  return this.deleteOne({ _id: userId });
};



module.exports = mongoose.model("user", userSchema);
