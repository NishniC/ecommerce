const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;


const offerSchema = new mongoose.Schema({
  offer_name: {
    type: String,
    required: [true, "Enter name"],
  },
  type: { type: String, required: [true, "Enter type"] },
  typeoffer: { type: String, required: true },
  category: {
    type: Array,
    default: "Girls",
  },
  productId: {
    type: Array,
    default: 0,
    required: [true, "Enter product"],
  },
  referenceId: {
    type: String,
    default: 0,
    required: [true, "Enter code"],
  },
  discount: { type: Number, required: [true, "Enter discount"] },
  valid_from: { type: Date, required: [true, "Enter valid from date"] },
  valid_to: { type: Date, required: [true, "Enter valid to"] },
  maxAmount: { type: Number, default: 0, required: [true, "Enter maxAmount"] },
  unlist: { type: Boolean, default: true },
  usedUser: [{ type: String, default: null }],
  expired: { type: Boolean, default: false },
});

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;