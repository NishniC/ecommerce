var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const wishlistHelpers = require("../helpers/wishlist-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Wishlist = require("../models/wishlist");



exports.viewWishlist=async(req,res)=>{
    try{
      console.log("inside wishlis")
    let user = req.session.user;
    const wishlist = await Wishlist.findOne({ userId: user._id });
     if (wishlist) {
       const products = await wishlistHelpers.getwishlistProducts(req, res);
       try{
        products.forEach((product) => {
            if (product.product.quantity > 0){
                 product.isInStock = true;
            }else{
                product.isInStock = false;
            }
        });
       }catch(error){
        console.log("error for:",error)
       }
        
    res.render("user/view-wishlist", { user,products });
     } else {
        res.redirect("/user/wishlist-empty");
    }
    }catch(error){

    }
}


exports.addtowishlist=async(req,res)=>{
      try {
        const result = await wishlistHelpers.addtowishlist(req, res);

        if (result.error) {
          res.status(400).json({ error: result.error });
        } else {
          // Product added successfully
          if (result.newWishlist) {
            console.log("New Wishlist:", result.newWishlist);
          } else {
            console.log("updated Wishlist: ", result.existingUser);
          }
          return res.redirect("/user/wishlist");
        }
      } catch (error) {
        console.error("usercontroller: ", error);
        res.status(500).send("Internal Server Error");
      }
}


exports.wishlistItemRemove=async(req,res)=>{
    try{
    let wishlistId=req.params.wid;
    let productId=req.params.pid
    isProductEmpty = await wishlistHelpers.wishlistitemRemove(wishlistId, productId);
    const products = await wishlistHelpers.getwishlistProducts(req, res);
    products.forEach((product) => {
         if (product.product.quantity > 0) {
           product.isInStock = true;
         } else {
           product.isInStock = false;
         }
       });
       console.log("products", products);

    res.status(200).json({status: true,isProductEmpty: isProductEmpty,products});
    }catch(error){

    }
}

exports.getwishlistempty=async(req,res)=>{
    try{
    let user = req.session.user;
    res.render("user/view-emptywishlist", { user });

    }catch(error){
        console.log("get empty wishlist:",error)
    }
}


exports.addtocartwish=async(req,res)=>{
      try {
            let wishlistId = req.params.pid;
            let productId = req.params.wid;
        console.log("inside add-to-cart");
            isProductEmpty = await wishlistHelpers.wishlistitemRemove(
              wishlistId,
              productId
            );

        const result = await wishlistHelpers.addtocartwish(req, res,wishlistId);

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
}