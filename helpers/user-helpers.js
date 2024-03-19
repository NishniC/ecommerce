const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const Wishlist = require("../models/wishlist");




exports.getWishlistCount = async (userId) => {
  try {
    let count = 0;
    let wishlist = await Wishlist.findOne({ userId: userId });
    if (wishlist) {
      count = wishlist.productId.length;
    }
    return count;
  } catch {

  }
};

exports.getCartCount = async (userId) => {
  try {
    let count = 0;
    let cart = await Cart.findOne({ userId: userId });
    if (cart) {
      count = cart.productId.length;
    }
    return count;
  } catch {}
};

exports.getProductsByCategory = async (category) => {
    try {
      const products = await Products.find({
        Category: { $in: [category] },
      }).lean();
      return products;
    } catch (error) {
      throw new Error("Error fetching products by category: " + error.message);
    }
};


exports.changeProductQuantity = async (details) => {
  const count = parseInt(details.count);

  try {
    const updatedCart = await Cart.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId.createFromHexString(details.cart),
        "productId.item": details.product,
      },
      { $inc: { "productId.$.quantity": count } },
      { new: true }
    );

    if (updatedCart) {
      // If the cart is updated successfully, return the updated quantity
      const updatedProduct = updatedCart.productId.find(
        (product) => product.item.toString() === details.product
      );

      if (updatedProduct) {
        const updatedQuantity = updatedProduct.quantity;
        return { success: true, quantity: updatedQuantity };
      }
    }

    return { success: false, message: "Failed to update quantity" };
  } catch (error) {
    console.error("Error updating product quantity:", error);
    throw error;
  }
};










exports.getSearchProducts = async (regexQuery) => {
  var product_data = await Products.aggregate([
     {
       $match: { Name: regexQuery },
     },
   ]);
    return  product_data ;

};









