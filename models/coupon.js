const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: [true, "Enter Coupon Code"],
  },
  description:{ type: String,default:"coupon"},
  typeoffer: { type: String, required: true },
  discount: { type: Number, required: [true, "Enter discount"] },
  valid_from: { type: Date, required: [true, "Enter valid from date"] },
  valid_to: { type: Date, required: [true, "Enter valid to"] },
  minAmount: { type: Number, default: 0, required: [true, "Enter minimum amount"] },
  unlist: { type: Boolean, default: true },
  usedUser: [{ type: String, default: null }],
  expired:{type:Boolean,default:false}
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
