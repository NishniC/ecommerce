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
const crypto = require("crypto");
const { Transaction } = require("mongodb");




const hashReferralCode = (referralCode) => {
  const hash = crypto.createHash("sha256");
  hash.update(referralCode);
  return hash.digest("hex");
};
exports.homePage = async (req, res) => {
  try {
  let user = req.session.user;
  if(user.role==='admin'){
    res.redirect("/admin");
  }else{
  let cartCount=await userHelpers.getCartCount(req.session.user._id);
  let wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
    let categories = await categoryHelpers.getMainCategory();
  adminHelpers.getAllProducts().then((products) => {
    res.render("user/view-home", { products, user,cartCount,categories,wishlistCount });
  });
  }
  } catch (error) {
    console.error("Error handling OTP verification request:", error);
    res.status(500).json({ errors: { otp: "Error verifying OTP" } });
  }
};


exports.productDetailsPage = async (req, res) => {
   let user = req.session.user;
   let productId = req.params.id; // Corrected parameter name
   console.log("po:", productId);
   try {
     let product = await Products.findOne({ _id: productId }).lean();
     console.log("proopspfdg", product);
     // Render the product details page with specific properties
     res.render("user/product-details", {
       product,
       user,
     });
   } catch (error) {
     console.error(error);
     res.status(500).send("Internal Server Error");
   }
};


exports.categoryPage = async (req, res) => {
  let categoryName=req.params.name;
  let user = req.session.user;
  let categories = await categoryHelpers.getMainCategory();

   try {
     const products = await userHelpers.getProductsByCategory(categoryName);
     res.render("user/category.hbs", {products,category: categoryName,user,categories,});
   } catch (error) {
     console.error("Error fetching products by category:", error);
     res.status(500).send("Internal Server Error");
   }
};


exports.categorymenPage = async (req, res) => {
   let user = req.session.user;
   const products = await userHelpers.getProductsByCategory("men");
   res.render("user/category.hbs", { products, category: "Men", user });
};



exports.categoryboysPage = async (req, res) => {
   let user = req.session.user;
   const products = await userHelpers.getProductsByCategory("boys");
   res.render("user/category.hbs", { products, category: "Boys", user });
};



exports.categorygirlsPage = async (req, res) => {
  let user = req.session.user;
  const products = await userHelpers.getProductsByCategory("girls");
  res.render("user/category.hbs", { products, category: "Girls", user });
};


exports.changeProQuantity = (req, res, next) => {
    let user = req.session.user;
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    if (response.success) {
      response.total = await cartHelpers.getTotalAmount(user._id);
     
console.log("errrrrrrrrrrr",response.total)
      res.status(200).json({ success: true, quantity: response.quantity,total:response.total });
    } else {
      // If there is an error or the quantity update fails, handle it accordingly
      res.status(500).json({ success: false, message: response.message });
    }
  });
};



exports.searchProduct=async(req,res)=>{
  try{
  const query = req.query.query;
      console.log("i am:",query);
const regexQuery = new RegExp(`^${query}`, "i");
const regexQueryString = new RegExp(query, "i");
 var product_data = await Products.find({ Name: regexQuery });
  var similarproduct_data = await Products.find({ Name: regexQueryString });
var length=product_data.length;
console.log("pro:",product_data)
if(product_data.length > 0){
  res.status(200).send({success:true,data:product_data,similardata:similarproduct_data,length})
}else{
    res.status(200).send({ success: true, msg:"Products not found!" });

}
  }catch(error){
        res.status(400).send({ success: false, msg: error.message });

  }
}







exports.searchbuttonProduct=async(req,res)=>{
    try {
        let user = req.session.user;
      const query = req.query.query;
      console.log("i am:", query);
      const regexQuery = new RegExp(`^${query}`, "i");
      const regexQueryString = new RegExp(query, "i");
      var product= await userHelpers.getSearchProducts(regexQuery);
      var similarproduct_data = await Products.find({ Name: regexQueryString });
            console.log("Product Data Type:", typeof product);

      console.log("pro:", product);
      if (product.length > 0) {
              console.log("profffffff:",product);
          res.render("user/search-product", {product,user,empty:false});
        
      } else {
          res.render("user/search-product", { product, user,empty:true });
      }
    } catch (error) {
      res.status(400).send({ success: false, msg: error.message });
    }
}



exports.walletPage = async (req, res) => {
  try {
          console.log("i am in");
    let user = req.session.user;
    let wallet = await cartHelpers.getUserWallet(user._id);
    if (wallet.msg) {
      console.log("i am out");
      res.render("user/wallet.hbs", {
        user,
        balance: 0.0,
      });
    } else {
      let transactions = wallet.history.map((transaction) => ({
        ...transaction._doc,
        formattedTimestamp: new Date(transaction._doc.timestamp).toLocaleString(
          "en-US",
          {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        ),
      }));
      console.log("i am in:", transactions);
      try {
        res.render("user/wallet.hbs", {
          user,
          balance: wallet.wallet.balance,
          transactions,
        });
      } catch (err) {
        console.log("Error rendering template:", err);
      }
    }
  } catch (error) {
    console.log("Error:", error);
  }
};




exports.getUserRefferal=async(req,res)=>{
      let user = req.session.user;
      // const hashedReferralCode = hashReferralCode(user.referralCode);
      console.log("user referalcode:", user.referralCode);
      try{
    res.render("user/view-referralLink", { user,code:user.referralCode});

      }catch(error){

      }

}















