var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const orderHelpers = require("../helpers/order-helpers");
const profileHelpers = require("../helpers/profile-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Address = require("../models/address");
const mongoose = require("mongoose");


//get profileile page
exports.userProfilePage = async (req, res) => {
  let user = req.session.user;
  res.render("user/user-profile", { user });
};


//get profile edit page 
exports.userEditPage = async (req, res) => {
  let user = req.session.user;
  res.render("user/edit-profile", { user });
};


// post user edit name
exports.editUserName = async (req, res) => {
  try {
    let userId = req.params.id;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;

    const updatedProfileName = await profileHelpers.editProfileName(
      userId,
      firstName,
      lastName
    );
    console.log(updatedProfileName, "ujahh");
    if (updatedProfileName.errors) {
      // Handle the error case
      return res.status(400).json({
        error: updatedProfileName.errors,
        message: "Error updating name",
      });
    } else {
      console.log("Your name is updated");
      res.status(201).json({
        newName: updatedProfileName.updatedUser,
        message: "Your Name is successfully changed",
      });
    }
  } catch (error) {
    console.error("Error updating name:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//edit useremail
exports.editUserEmail = async (req, res) => {
  try {
    let userId = req.params.id;
    let email = req.body.email;
    const updatedEmail = await profileHelpers.editEmail(userId, email);
    console.log("updated email", updatedEmail);
    if (updatedEmail.errors) {
      // Handle the error case
      return res.status(400).json({
        error: updatedEmail.errors,
        message: "Error updating name",
      });
    } else {
      console.log("Your name is updated");
      res.status(201).json({
        newEmail: updatedEmail,
        message: "Your email is verification process",
      });
    }
  } catch (error) {
    console.error("Error updating name:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//updated otp page
exports.updatedotpPage = async (req, res) => {
  let user = req.session.user;
  let jsonData = req.query.jsonData;

  // Parse the JSON data back to an object
  let data = {};
  try {
    data = JSON.parse(decodeURIComponent(jsonData));
    res.render("user/updatedotpPage", { user, data });

    console.log("dataa:", data);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
  }
};

//verify new otp page
exports.verifynewotp = async (req, res) => {
  try {
    console.log(req.body);
    const response = await profileHelpers.verifynewOTP(req, res);

    if (response.message) {
      // Redirect to the user dashboard or any other page
      res.status(200).json({ message: response.message });
    } else {
      res.status(400).json({ errors: { otp: response.errors.otp } });
    }
  } catch (error) {
    console.error("Error handling OTP verification request:", error);
    res.status(500).json({ errors: { otp: "Error verifying OTP" } });
  }
};

//get for logout page
exports.forlogout = async (req, res) => {
  let user = req.session.user;
  res.render("user/profileupdatesuccess", { user });
};



//edit password
exports.editpassword = async (req, res) => {
  let userId = req.params.id;
  console.log("body", req.body);
  let oldPassword = req.body.formpreviouspassword;
  let newPassword = req.body.formnewpassword;
  let confirmpassword = req.body.formconfirmpassword;
  try {
    const response = await profileHelpers.newPassword(userId,oldPassword,newPassword,confirmpassword);
    if (response.errors) {
      // Handle the error case
      return res.status(400).json({
        error: response.errors,
        message: "Error updating name",
      });
    } else {
      console.log("Your name is updated");
      res.status(201).json({
        newPassword: response,
        message: "Your password is succesfully changed",
      });
    }
  } catch (error) {}
};

exports.myaddress = async (req, res) => {
  try {
    let userId = req.params.id;
    let user = req.session.user;
    let address = await profileHelpers.addressFind(userId)

    // Convert the address object to a JSON string

    console.log("myaddress:", address);

    // Pass the JSON string to the template instead of the object
    res.render("user/myAddress", { user, address:address.total });
  } catch (error) {
    console.log("error:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.editaddress = async (req, res) => {
  try {
    let addressId = req.params.id;
    console.log("id is:",addressId)
    let user = req.session.user;
    let myaddress = await profileHelpers.singleaddress(addressId);

    let address=myaddress.address;
    fname=address.firstName;
    house = address.houseName;
    town = address.townCity;
    state = address.stateCounty;
    zip = address.postcodeZIP;
    phn=address.phone;
    email=address.email
    id=address._id
    userid=address.userId

    console.log("firsyName", fname);
    console.log("myaddress:", address);

    res.render("user/editAddress", { user,fname,house,town,state,zip,phn,email,id,userid});
  } catch (error) {
    console.log("error:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.editaddresspost = async (req, res) => {
  try {
    let addressId = req.params.id;

    console.log("id is:", addressId);
    let user = req.session.user;
    let response = await profileHelpers.editsingleaddress(addressId,req.body);
    if(response.error){

    }else{
    res.json({ status: true, response });

    }
  } catch (error) {
    console.log("error:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteaddress = async (req, res) => {
  try {
    let addressId = req.params.id;

    console.log("id is:", addressId);
    let user = req.session.user;

     const deletedAddress = await Address.findByIdAndDelete(addressId);

     // Check if the address exists
     if (!deletedAddress) {
       console.error("Address not found");
       return res.status(404).json({ error: "Address not found" });
     }

     console.log("Deleted address:", deletedAddress);
     res.json({ status: true, message: "Address deleted successfully" });
    
  } catch (error) {
    console.log("error:", error);
    res.status(500).send("Internal Server Error");
  }
};



exports.addaddress = async (req, res) => {
  let user = req.session.user;
  console.log("user:",user)
  try {
    res.render("user/add-address", { user});
  } catch (error) {
    console.log("error is:", error);
  }
};

exports.addaddressform = async (req, res) => {
  let user = req.session.user;
  try{
    let response = await orderHelpers.saveAddress(req.body);
    console.log("response:",response)
    if(response.errors){
       res.json({ response });
    }else{
    console.log("ree:",response)
    res.json({ status: true, response });

    }

  }catch(error){

   
  }
};