var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");




//get cart page
exports.cartDetailsPage = async (req, res) => {
    req.session.order = false;

  try {
    let user = req.session.user;
    const cart = await Cart.findOne({ userId: user._id });

    if (cart) {
      const products = await cartHelpers.getcartPage(req, res);
      let total = await cartHelpers.getTotalAmount(user._id);

      console.log("products", products);
      res.render("user/cart-details", { user, products, total });
    } else {
      res.render("user/cart-details-empty", { user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


//get empty cart
exports.cartdetailsempty = (req, res) => {
  let user = req.session.user;
  res.render("user/cart-details-empty", { user });
};


//add to cart button
exports.addtocart = async (req, res) => {
  try {
    console.log("inside add-to-cart");
    const result = await cartHelpers.addtocart(req, res);

    if (result.error) {
      // Handle duplicate or other errors
      res.status(400).json({ error: result.error });
    } else {
      // Product added successfully
      if (result.newCart) {
        console.log("New product:", result.newCart);
      } else {
        console.log("updated cart: ", result.existingCartItem);
      }
      return res.redirect("/user/cartDetails");
    }
  } catch (error) {
    console.error("usercontroller: ", error);
    res.status(500).send("Internal Server Error");
  }
};


//change producct quantity
exports.changeProQuantity = (req, res, next) => {
  let user = req.session.user;
  console.log("bodyyy:",req.body)
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    if (response.success) {
      response.total = await cartHelpers.getTotalAmount(user._id);
      subtotal = parseInt(req.body.price) * parseInt(response.quantity);

      res
        .status(200)
        .json({
          success: true,
          quantity: response.quantity,
          total: response.total,
          subtotal:subtotal
        });
    } else {
      // If there is an error or the quantity update fails, handle it accordingly
      res.status(500).json({ success: false, message: response.message });
    }
  });
};


//remove cart items
exports.cartItemRemove = async (req, res) => {
  console.log("bodyyy", req.body);
  const cartId = req.body.cart;
  const proId = req.body.product;

  isProductEmpty = await cartHelpers.cartItemRemove(cartId, proId);

  console.log(isProductEmpty);
  res.status(200).json({
    success: true,
    isProductEmpty: isProductEmpty,
  });
};