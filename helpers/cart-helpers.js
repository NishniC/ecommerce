const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const Wallet = require("../models/wallet");


//get Cart page
exports.getcartPage = async (req, res) => {
  let user = req.session.user;
  try {
    const cartItems = await Cart.aggregate([
      {
        $match: { userId: user._id },
      },
      {
        $unwind: "$productId",
      },
      {
        $project: {
          item: "$productId.item",
          quantity: "$productId.quantity",
        },
      },
      {
        $addFields: {
          // Convert the 'item' field to ObjectId
          itemId: { $toObjectId: "$item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
      {
        $addFields: {
          // Convert the 'item' field to ObjectId
          subtotal:  { $multiply: ["$quantity", "$product.price"]  },
        },
      },
    ]);
    console.log("catess", cartItems);
    return cartItems;
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
};



//getTotal amount of cart product

exports.getTotalAmount = async (userId) => {
  try {
    const total = await Cart.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $unwind: "$productId",
      },
      {
        $project: {
          item: "$productId.item",
          quantity: "$productId.quantity",
        },
      },
      {
        $addFields: {
          // Convert the 'item' field to ObjectId
          itemId: { $toObjectId: "$item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
        },
      },
    ]);
    console.log("total amount of cart", total[0].total);
    return total[0].total;
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
};



//get total discount of cart items
exports.getTotalDiscount = async (userId) => {
  try {
    const totalDiscount = await Cart.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $unwind: "$productId",
      },
      {
        $project: {
          item: "$productId.item",
          quantity: "$productId.quantity",
        },
      },
      {
        $addFields: {
          // Convert the 'item' field to ObjectId
          itemId: { $toObjectId: "$item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalDiscount: {
            $sum: {
              $multiply: ["$quantity", "$product.discount"],
            },
          },
        },
      },
    ]);

    if (totalDiscount.length > 0) {
      console.log("Total discount of cart:", totalDiscount[0].totalDiscount);
      return totalDiscount[0].totalDiscount;
    } else {
      return 0; // Return 0 if there are no cart items or discounts
    }
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
};



//add to cart button
exports.addtocart = async (req, res) => {
  let user = req.session.user;
  let productId = req.params.id;
  let proObj = {item: productId,quantity: 1,};
  try {
    const existingCartItem = await Cart.findOne({ userId: user._id });

    if (existingCartItem) {
      let proExist = existingCartItem.productId.findIndex(
        (product) => product.item == productId
      );

      if (proExist !== -1) {
        // Product already exists in the cart, update the quantity
        await Cart.updateOne(
          { userId: user._id, "productId.item": productId },
          { $inc: { "productId.$.quantity": 1 } }
        );
      } else {
        // Product does not exist in the cart, add a new entry
        await Cart.updateOne(
          { userId: user._id },
          { $push: { productId: proObj } }
        );
      }

      console.log(
        "User already exists in the cart, updated the cart:",
        existingCartItem
      );
      return { existingCartItem };
    } else {
      // User does not have a cart, create a new cart with the product
      const newCart = new Cart({
        userId: user._id,
        productId: [proObj],
      });

      await newCart.save();
      console.log("New Cart:", newCart);
      return { newCart };
    }
  } catch (err) {
    console.error("Error adding to cart:", err.message);
    throw err;
  }
};



//change product quantity
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
      console.log("updateeeeeee:",updatedCart)
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


//remove cart items
exports.cartItemRemove = async (cartId, proId) => {
  console.log("cartId", cartId);
  console.log("productId", proId);
  await Cart.updateOne(
    { _id: mongoose.Types.ObjectId.createFromHexString(cartId) },
    { $pull: { productId: { item: proId } } }
  );
  const cart = await Cart.findById(cartId);
  const isProductsEmpty = cart.productId.length === 0;
  if (cart && isProductsEmpty) {
    let cart = await Cart.deleteOne({
      _id: mongoose.Types.ObjectId.createFromHexString(cartId),
    });
  }
  console.log("Is products array empty:", isProductsEmpty);
  return isProductsEmpty;
};



exports.getUserWallet= async (userId)=>{
   try {
     const wallet = await Wallet.findOne({ userId: userId });
     if (wallet) {
       console.log("User's wallet found:", wallet);
       return { wallet, history: wallet.transactionHistory };
     } else {
       console.log("User does not have a wallet");
       return {msg:"not found"};
     }
   } catch (error) {
     console.error("Error finding user's wallet:", error);
     throw error;
   }
}