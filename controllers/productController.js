var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const categoryHelpers = require("../helpers/category-helpers");
const filterHelpers = require("../helpers/filter-helpers");
const { body } = require("express-validator");


exports.productPage = async (req, res) => {
  let user = req.session.user;
  let product = await adminHelpers.getAllProducts();
  const pageNum = req.query.page;
  const perPage = 6;
  let docCount = await adminHelpers.getProduct().countDocuments(); // Count documents in the query
  let products = await adminHelpers
    .getProduct()
    .skip((pageNum - 1) * perPage)
    .limit(perPage)
    .exec(); // Execute the query
  let length = product.length;
  res.render("user/view-productfilter", {
    user,
    products,
    length,
    currentPage: parseInt(pageNum),
    totalDocuments: docCount,
    pages: Math.ceil(docCount / perPage),
  });
};



exports.profilter= async (req, res) => {
    try{
      let user = req.session.user;
      const pageNum = req.query.page;
      const perPage = 6;
      console.log("body:", req.body);
      var products = await filterHelpers.getfilterProducts(req.body);
      let length = products.length;
      console.log("pro:", products);
      console.log("length:", length);
      var products = products.slice(
        (pageNum - 1) * perPage,
        pageNum * perPage
      ); // Paginate the orders
      if (length > 0) {
        res.status(200).json({
          success: true,
          products: products,
          length,
          currentPage: parseInt(pageNum),
          totalDocuments: length,
          pages: Math.ceil(length / perPage),
        });
      } else {
        res.status(200).json({
          success: false,
          msg:"no product found"
        });
      }
    }catch(error){
    console.log("error:",error)
}
};





exports.productpagination = async (req, res) => {
  try {
    let user = req.session.user;
    const pageNum = req.query.page;
    const perPage = 6;
    const queryString = req.query.details;
    console.log("body:", pageNum,queryString);
     const queryParams = new URLSearchParams(queryString);
     const priceRange = queryParams.get("price_range");
     const categories = queryParams.getAll("categories[]");
     console.log("Price range:", priceRange);
     console.log("Categories:", categories);
     let body;
     if (priceRange && !categories){
         body = { price_range: priceRange };
     }
     if (categories && !priceRange) {
        body = { categories: categories };
     }
     if (categories && priceRange) {
        body = { categories: categories };
     }
      var products = await filterHelpers.getfilterProducts(body);
      let length = products.length;
      var products = products.slice((pageNum - 1) * perPage, pageNum * perPage);
      let docCount = products.length;
     res.render("user/view-productfilter", {
       user,
       products,
       length,
       currentPage: parseInt(pageNum),
       totalDocuments: length,
       pages: Math.ceil(length / perPage),
     });
  } catch (error) {
    console.log("error:", error);
  }
};