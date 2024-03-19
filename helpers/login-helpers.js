const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const { isEmail } = require("validator");
const Wallet = require("../models/wallet");



// const Admin=require("../models/admin")

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const generateReferralCode = () => {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let code = "";

  // Generate the first two letters
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate the next four numbers
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
};


const resendOTPEmail = async (email, otp) => {
  // Implement the email sending logic similar to the sendOTPEmail function
  // ...

  try {
    await transporter.sendMail(mailOptions);
    console.log("Resent OTP email");
  } catch (error) {
    console.error("Error resending OTP email:", error);
    throw error;
  }
};

const handleErrors = (err) => {
  
  console.log(err.message, err.code);
  let errors = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    confirmpassword: "",
  };

  //incorrect email
  if (err.message == "Incorrect email") {
    errors.email = "That email is not registered";
  }

  //incorrect ppassword
  if (err.message == "Incorrect password") {
    errors.password = "That password is incorrect";
  }
  //duplicate error
  if (err.code === 11000 && verified === false) {
    errors.email = "that email is already registered";
    return errors;
  }

  //validation error
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};




//////create token//////////
const createToken = (id) => {
  return jwt.sign({ id }, "thisismysecret", {
    expiresIn: 60000,
  });
};



///////// Function to send OTP via email/////////////////////
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    // configure your email transport here
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
    text: `Your OTP for email verification is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent");
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};




//post login
exports.dologin = async (req, res) => {
  const { email, password } = req.body;
   if (!email && !password) {
     const errors = {
       email: "Email is required",
       password: " password is required",
     };
     return res.status(400).json({ errors });
   }
    if (!email ) {
      const errors = { email: "Email is required" };
      return res.status(400).json({ errors });
    }
      if ( !password) {
        const errors = { password: " password is required" };
        return res.status(400).json({ errors });
      }
       if (!isEmail(email)) {
    const errors = { email: "Please enter a valid email address" };
    return res.status(400).json({ errors });
  }
  try {
    // const user = await User.login(email, password);
        const user = await User.findOne({email:req.body.email });
        console.log("login user:",user)

        if(user){

          if(user.access){
                  const auth = await bcrypt.compare(password, user.password);
                  if (auth) {
                    req.session.user = user;
                    const token = createToken(user._id);
                    res.cookie("jwt", token, {
                      httpOnly: true,
                      maxAge: 86400000,
                    });
                    req.session.loggedIn=true;
                    res.status(200).json({ user: user._id, role: user.role });
                  } else {
                    const errors = { password: "the password is not correct" };
                     return res.status(400).json({ errors });
                  }
                }else{
                  const errors = { email: "Your Account is suspended" };
                 return res.status(400).json({ errors });

                }
        }else{
          const errors = { email: "This email is not registered"};
           return res.status(400).json({ errors });
        }


  } catch (err) {
    console.error("Login error:", err.message);
    const errors = handleErrors(err);

    res.status(400).json({ errors });
  }
};



// post signup form 
exports.doSignup = async (req, res) => {
    
    if (req.body.referalLink) {
      var referralLink = req.body.referalLink;
      console.log("do signup link:", referralLink);
    }

  console.log("neeeeww", req.body);
  var newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    confirmpassword: req.body.confirmpassword,
    verified: false,
  });
   newUser.referralCode = generateReferralCode();
   if (req.body.referalLink) {
     newUser.referralLink = req.body.referalLink;
   }
  console.log("neeeeeeeewww", newUser);
  

  try {
    await newUser.validate();

   const existingUser = await User.findOne({email:newUser.email });
   console.log("existinguser:",existingUser)
      if (existingUser) {
        const errors = { email: "This email is already registered" };
        return res.status(400).json({ errors });
      }


      if (!req.body.password.match(/[a-zA-Z]/)) {
        const errors = {
          password: "Password must contain at least one letter",
        };
        return res.status(400).json({ errors });
      }
      if (!req.body.password.match(/\d/)) {
        const errors = {
          password: "Password must contain at least one number",
        };
        return res.status(400).json({ errors });
      }
      if (!req.body.password.match(/[@$!%*?&]/)) {
        const errors = {
          password: "Password must contain at least one special character",
        };
        return res.status(400).json({ errors });
      }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(newUser.password, saltRound);
    newUser.password = hashedPassword;
    newUser.confirmpassword = hashedPassword;   
    const otp = generateOTP();
    newUser.otp = otp;
    req.session.newUser=newUser
    console.log("new user in session",req.session.newUser)
    req.session.email = newUser.email; // Store email in session

    res
      .status(201)
      .json({ newUser: newUser._id, message: "OTP sent for verification" });
  } catch (error) {
    const errors = handleErrors(error);
    console.log("errorsssssss", errors);
    res.status(400).json({ errors });
  }
};



///verify otp
exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;

  try {

    newUser=req.session.newUser;
    console.log("newuser:",newUser);
    console.log("otp",otp)
    if(newUser.otp == otp){
      console.log("user: inside");
      newUser.verified = true;
      if(newUser.referralLink){
        refcode = newUser.referralLink;
        const referringUser = await User.findOne({ referralCode:refcode });
        console.log("referringUser:", referringUser);
        if (referringUser) {
          try{  
            let userWallet = await Wallet.findOne({ userId: referringUser._id });
            if(!userWallet){
              try {
                userWallet = await Wallet.create({
                  userId: referringUser._id,
                  balance: 0,
                  transactionHistory: [], // Initialize transaction history
                });
              } catch (error) {
                console.log("err:", error);
              }
              
            }
           var wallet = await Wallet.findOneAndUpdate(
             { userId: referringUser._id },
             { $inc: { balance: 250 } }, // Increment balance by 250rs
             { new: true }
           );
           wallet.transactionHistory.push({
             type: "credit", // Transaction type: credit
             amount: 250,
             name: "Referral bonus", // Description of the transaction
             timestamp: new Date(),
           });
           await wallet.save();
           console.log("wallet:",wallet)
          }catch(error){
            console.log("referal error:",error)
          }

        }
      }
      const user = await User.create(newUser);
      req.session.email = undefined;
      req.session.newUser = undefined;
        req.session.loggedIn = true;
        req.session.user = user;
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: 860000 });
        console.log("User verified successfully");
        return {
          message: "OTP verified successfully",
          user: user._id,
          role: user.role,
        };
    }else{
        console.log("Invalid OTP");
        return { errors: { otp: "Invalid OTP" } };
    }
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    throw error;
  }
};