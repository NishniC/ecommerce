const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;



// Define subdocument schema for order address
const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  houseName: { type: String, required: [true, "house name is required"] },
  townCity: { type: String, required: [true, "city is required"] },
  stateCounty: { type: String, required: [true, "state is required"] },
  postcodeZIP: { type: String, required: [true, "zip code is required"] },
  phone: { type: String, required: [true, "phone is required"] },
  email: {
    type: String,
    required: [true, "email is required"],
    validate: [isEmail, "Please enter a valid email"],
  },
});

const productSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId,}, 
  quantity: { type: Number},
});

const orderSchema = new mongoose.Schema({
  address: { type: addressSchema, required: true },
  Products: [productSchema],
  totalAmount: { type: Number, required: true },
  cancelproducts: { type: Array },
  userId: { type: String, required: true },
  paymentMethod: {
    type: String,
    required: [true, "select your payment method"],
  },
  status: { type: String, required: true },
  referenceNo: { type: String },
  date: { type: Date, default: Date.now, required: true },
  delivereddate: { type: Date, default: null },
  orderstatus: { type: String, default: null },
  reason: { type: String, default: null },
  discount: { type: Number, default: 0 },
  coupon: { type: Number, default: 0 },
  products: { type: Array, required: true },
  originalAmount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
