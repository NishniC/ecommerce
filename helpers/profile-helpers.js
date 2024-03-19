const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const Address = require("../models/address");



exports.editProfileName = async (userId, firstName, lastName) => {
  try {
    // Find the existing product by ID
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return { error: "user not found" };
    }
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    try {
      await existingUser.validate();

      const updatedUser = await existingUser.save();
      console.log(updatedUser);
      return { updatedUser };
    } catch (error) {
      const errors = handleErrors(error);
      return { errors };
    }
  } catch (error) {
    console.error("Error editing product:", error);
    return { error: "Error editing product" };
  }
};


// update useremail
exports.editEmail = async (userId, email) => {
  const existingUser = await User.findById(userId);
  console.log(existingUser);
  if (existingUser.email === email) {
    return { errors: "the Email is Same" };
  } else {
    try {
      const existingUser = await User.findById(userId);

      newEmail = email;
      oldEmail = existingUser.email;
      existingUser.email = newEmail;
      console.log("existing user", existingUser.email);
      await existingUser.validate();
      existingUser.email = oldEmail;
      console.log("email:", existingUser.email);
      const newOTP = generateOTP();
      const oldOTP = existingUser.otp;
      await sendOTPEmail(newEmail, newOTP);
      return { existingUser, newEmail, newOTP };
    } catch (error) {
      const errors = handleErrors(error);
      console.log("errorsssssss", errors);
      return { errors };
    }
  }
};

//verify new otp
exports.verifynewOTP = async (req, res) => {
  try {
    const enterOTP = req.body.otp;
    const userId = req.body.userId;
    const newEmail = req.body.newEmail;
    const newOTP = req.body.newOTP;
    const existingUser = await User.findById(userId);
    console.log("existingUser", existingUser);
    if (enterOTP === newOTP) {
      existingUser.email = newEmail;
      existingUser.otp = newOTP;
      const updatedUser = await existingUser.save();
      console.log("User verified successfully");
      return { message: "OTP verified successfully" };
    } else {
      console.log("Invalid OTP");
      return { errors: { otp: "Invalid OTP" } };
    }
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    throw error;
  }
};


//new password
exports.newPassword = async (userId,oldPassword,newPassword,confirmpassword) => {
  try {
    const existingUser = await User.findById(userId);

    // Check if the provided old password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(
      oldPassword,
      existingUser.password
    );

    if (!passwordMatch) {
      return { errors: { oldPassword: "Incorrect old password" } };
    }
    if (newPassword !== confirmpassword) {
      return {
        errors: { notequalpassword: "two password is not correct" },
      };
    }
    existingUser.password = newPassword;
    existingUser.confirmpassword = confirmpassword;
    await existingUser.validate();
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(existingUser.password, saltRound);
    existingUser.password = hashedPassword;
    existingUser.confirmpassword = hashedPassword;
    const updatedUser = await existingUser.save();
    return { updatedUser };
  } catch (error) {
    const errors = handleErrors(error);
    console.log("errorsssssss", errors);
    return { errors };
  }
};

exports.addressFind = async(userId)=>{
   const total = await Address.aggregate([
     {
       $match: { userId: userId },
     },
   ]);
   console.log("total amount of cart", total);
   return {total}
}


exports.singleaddress = async (addressId) => {
  try {
    const address = await Address.findById(addressId);
    console.log("address", address);
    return { address };
  } catch (error) {
    console.error("Error fetching address:", error);
    return { error: "Error fetching address" };
  }
};



exports.editsingleaddress = async (addressId,addressdetails) => {
  try {
    const address = await Address.findById(addressId);
    address.firstName = addressdetails.fname || address.firstName;
    address.houseName = addressdetails.housename || address.houseName;
    address.townCity = addressdetails.city || address.townCity;
    address.stateCounty = addressdetails.state || address.stateCounty;
    address.postcodeZIP = addressdetails.postcode || address.postcodeZIP;
    address.phone = addressdetails.phone || address.phone;
    address.email = addressdetails.email || address.email;
    address.userId = addressdetails.userId || address.userId;

        console.log("addressbody", addressdetails);
        updatedAddress=await address.save();
    console.log("address", updatedAddress);

    return { updatedAddress };
  } catch (error) {
    console.error("Error fetching address:", error);
    return { error: "Error fetching address" };
  }
};




