const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;


const addressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  firstName: {type: String,required: [true, "first name is required"]},
  houseName: { type: String, required: [true, "house name is required"] },
  townCity: { type: String, required: [true, "city is required"] },
  stateCounty: { type: String, required: [true, "state is required"] },
  postcodeZIP: { type: String, required: [true, "zip code is required"] },
  phone: { type: String, required: [true, "phone is required"] },
  email: {type: String,required: [true, "email is required"],validate: [isEmail, "Please enter a valid email"],},
})


const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
