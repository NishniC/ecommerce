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


exports.addtowishlist=async(req,res)=>{
    let user = req.session.user;
    let Id = req.params.id;
    try {
      const existingUser = await Wishlist.findOne({ userId: user._id });

      if (existingUser) {      
          await Wishlist.updateOne(
            { userId: user._id },
            { $addToSet: { productId: Id } }
          );
       

        console.log(
          "User already exists in the Wishlist, updated the Cart",
          existingUser
        );
        return { existingUser };
      } else {
        const newWishlist = new Wishlist({
          userId: user._id,
          productId: Id,
        });

        await newWishlist.save();
        console.log("New Wishlist:", newWishlist);
        return { newWishlist };
      }
    } catch (err) {
      console.error("Error adding to wishlist:", err.message);
      throw err;
    }
}



exports.getwishlistProducts=async(req, res)=>{
    let user = req.session.user;
    try {
      const wishlistItems = await Wishlist.aggregate([
        {
          $match: { userId: user._id },
        },
        {
          $unwind: "$productId",
        },
        {
          $addFields: {
            // Convert the 'item' field to ObjectId
            itemId: { $toObjectId: "$productId" },
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
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
      ]);
      console.log("catess", wishlistItems);
      return wishlistItems;
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw error;
    }
}


exports.wishlistitemRemove=async(productId, wishlistId)=>{
    try{
        console.log("proid:",productId,"  wish:",wishlistId)
     let a= await Wishlist.updateOne(
        { _id: mongoose.Types.ObjectId.createFromHexString(wishlistId) },
        { $pull: { productId: productId } }
      );
      const wishlist = await Wishlist.findById(wishlistId);
      console.log("wish list:",wishlist)
      const isProductsEmpty = wishlist.productId.length === 0;
      if (wishlist && isProductsEmpty) {
        let wishlist = await Wishlist.deleteOne({
          _id: mongoose.Types.ObjectId.createFromHexString(wishlistId),
        });
      }
      console.log("Is products array empty:", isProductsEmpty);
      return isProductsEmpty;
    }catch(error){

    }
}



exports.addtocartwish = async (req, res,productId) => {
  let user = req.session.user;
  let proObj = { item: productId, quantity: 1 };
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

