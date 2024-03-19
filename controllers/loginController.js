var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const loginHelpers = require("../helpers/login-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


//sendotp email
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nishnicc@gmail.com",
      pass: "zbkf ejxi tkfg youy",
    },
  });
  const mailOptions = {
    from: "nishnicc@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for verification is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent");
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};


//get login page 
exports.loginPage = async (req, res) => {
  try {
    if (req.session.loggedIn) {
      res.redirect("/user");
    } else {
      res.render("login/index", { new: true });
    }
  } catch (error) {
    console.error("Error rendering homepage:", error);
    // Handle the error, perhaps redirect to an error page
    res.status(500).send("Internal Server Error");
  }
};



//post login Page
exports.loginPageSubmit = async (req, res) => {
  try {
    const response = await loginHelpers.dologin(req, res);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};


//get signup page
exports.signupPage = async (req, res) => {
  try {
          if (req.session.loggedIn) {
        res.redirect("/user");
      }else{
         var referralLink = req.query.ref;
         console.log("link", referralLink);
    res.render("login/signup", { new: true ,referralLink});}
  } catch (error) {
    console.log("Error rendering signup:", error);
    res.status(500).send("Internal Server Error");
  }
};


//post signup page
exports.signupPageSubmit = async (req, res) => {
  try {
    const newUser = await loginHelpers.doSignup(req, res);
      
  } catch (err) {
    console.log("in error errors:", err);
  }
};



//get OTP page 
exports.otpPage = async (req, res) => {
  try {
    if (req.session.loggedIn) {
      res.redirect("/user");
    } else if (req.session.email) {
       newUser = req.session.newUser;
          await sendOTPEmail(newUser.email, newUser.otp);

      res.render("login/verify-otp", { new: true });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log("Error rendering signup:", error);
    // Handle the error, perhaps redirect to an error page
    res.status(500).send("Internal Server Error");
  }
};


//post otp page 
exports.otpPageSubmit = async (req, res) => {
  try {
    const response = await loginHelpers.verifyOTP(req, res);
    console.log("Verification Response:", response);

    if (response.message) {
      // Update the session to mark the user as logged in

      res.status(200).json({
        message: response.message,
        user: response.user,
        role: response.role,
      });
    } else {
      res.status(400).json({ errors: { otp: response.errors.otp } });
    }
  } catch (error) {
    console.error("Error handling OTP verification request:", error);
    res.status(500).json({ errors: { otp: "Error verifying OTP" } });
  }
};



//logout
exports.logout = async (req, res) => {
  try {
    console.log("Entered /logout route");
    req.session.loggedIn=false;
    req.session.destroy();
    res.cookie("jwt", "", { maxAge: 1 });
    return res.redirect("/");
  } catch (error) {
    console.log("error is:", error);
    res.status(500).send("Internal Server Error");
  }
};



//resend otp 
exports.resendOTP = async (req, res) => {
  try {
    const user = req.session.newUser;
    if (user) {
      const newOTP = generateOTP();
      user.otp = newOTP;
      await sendOTPEmail(user.email, newOTP);
      req.session.timer = 1 * 60 * 1000;
      console.log("OTP Resent Successfully");
      return res.status(200).json({ message: "OTP resent successfully" });
    } else {
      console.log("User not found");
      return res.status(400).json({ errors: { general: "User not found" } });
    }
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    return res.status(500).json({ errors: { general: "Error resending OTP" } });
  }
};