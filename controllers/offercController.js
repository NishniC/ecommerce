var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const orderHelpers = require("../helpers/order-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Address = require("../models/address");
const Coupon = require("../models/coupon");
const profileHelpers = require("../helpers/profile-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const offerHelpers=require("../helpers/offer-helpers");
const Offer = require("../models/offer");


exports.viewofferModule = async (req, res) => {
  let user = req.session.user;
  try {
    let offersData = await offerHelpers.getCategoryOffer();

    // Check if offersData is an object with categoryOffers property
    if (offersData && Array.isArray(offersData.categoryOffers)) {
      const offers = offersData.categoryOffers;
      offers.forEach((offer) => {
        console.log("Offer name:", offer.offer_name);
      });
      res.render("admin/offer-page", { user, admin: true, offers });
    } else {
      console.log("Offers data format is incorrect:", offersData);
      // Handle the case where offersData format is incorrect
      // Render an error page or take appropriate action
    }
  } catch (error) {
    console.log("Error:", error);
    // Handle error
  }
};






exports.addcategorryofferModule=async(req,res)=>{
   let user = req.session.user;
    let categories = await categoryHelpers.getMainCategory();
   res.render("admin/add-categoryoffer", { user, admin: true,categories });
}



exports.addcategorryoffer = async (req, res) => {
   console.log("body:",req.body);
   try{
   let saveOffer = await offerHelpers.saveOfferCategory(req.body);
   console.log("save:",saveOffer)
   if(saveOffer.errors){
          res.status(400).json({ message:saveOffer.errors });
   }else{
        res.status(200).json({success: true,
          response: saveOffer.newOffer,
        });
   }
   }catch(error){

   }
};

exports.unlistoffer=async(req,res)=>{
   try{
   let offerId=req.params.id;
   let offer=await Offer.find({_id:offerId})
   if(offer[0].unlist){
   let updateResult = await Offer.updateOne({ _id: offerId },{ $set: { unlist: false } });
    let offersData = await offerHelpers.getCategoryOffer();
    let refoffersData = await offerHelpers.getreferralOffer();

   res.json({
     status: true,
     message: "offer unlisted successfully",
     details: offersData.categoryOffers,
     refdetails: refoffersData.categoryOffers,
   });

   }else{
      let updateResult = await Offer.updateOne({ _id: offerId },{ $set: { unlist: true } });
      let offersData = await offerHelpers.getCategoryOffer();
      let refoffersData = await offerHelpers.getreferralOffer();
     res.json({
       status: true,
       message: "offer listed successfully",
       details: offersData.categoryOffers,
       refdetails: refoffersData.categoryOffers,
     });   
   }
}catch(error){
   console.log("error",error)
}
}



exports.editcategoryoffer=async(req,res)=>{
   try{
        let user = req.session.user;
  let offerId=req.params.id;
  let offer = await Offer.findOne({ _id: offerId });
   console.log("offerid:",offer );
       let categories = await categoryHelpers.getMainCategory();
   res.render("admin/edit-categoryoffer", {
     user,
     admin: true,
     name: offer.offer_name,
     discount: offer.discount,
     id: offer._id,
     valid_from: offer.valid_from.toISOString().substring(0, 16),
     valid_to: offer.valid_to.toISOString().substring(0, 16),
     categories,
   });

   }catch(error){
      console.log("error:",error)
   }
}

exports.editcategorryoffer=async(req,res)=>{
   let offerId=req.params.id;
   console.log("id is:",offerId)
   let result = await offerHelpers.editOfferCategory(offerId,req.body);
   if( result.error){
          res.status(400).json({ message: result.errors });
   }else{
        res.status(200).json({ success: true });
   }


}



exports.viewproductoffer = async (req, res) => {
  let user = req.session.user;
  try {
 let offersData = await offerHelpers.getproductCategoryOffer();

 if (offersData && Array.isArray(offersData.categoryOffers)) {
   const offers = offersData.categoryOffers;
   offers.forEach((offer) => {
     console.log("Offer name:", offer);
   });
        console.log("Offer name:", offers);
   res.render("admin/view-productoffer", { user, admin: true, offers });
 } else {
   console.log("Offers data format is incorrect:", offersData);
   // Handle the case where offersData format is incorrect
   // Render an error page or take appropriate action
 }
    
  } catch (error) {
    console.log("Error:", error);
    // Handle error
  }
};


exports.addproductoffer = async (req, res) => {
  let user = req.session.user;
  let products=await adminHelpers.getAllProducts();
  console.log("products:",products)
  res.render("admin/add-productoffer", { user, admin: true, products });
};




exports.addproductcategorryoffer = async (req, res) => {
  console.log("body:", req.body);
  try {
  
   let saveOffer = await offerHelpers.saveOfferproductCategory(req.body);
   console.log("save:", saveOffer);
   if (saveOffer.errors) {
     res.status(400).json({ message: saveOffer.errors });
   } else {
     res.status(200).json({ success: true, response: saveOffer.newOffer });
   }
  } catch (error) {
    console.log("error:",error)
  }
};


exports.unlistproductoffer = async (req, res) => {
  try {
    let offerId = req.params.id;
    let offer = await Offer.find({ _id: offerId });
    if (offer[0].unlist) {
      let updateResult = await Offer.updateOne(
        { _id: offerId },
        { $set: { unlist: false } }
      );
      let offersData = await offerHelpers.getproductCategoryOffer();
      res.json({
        status: true,
        message: "offer unlisted successfully",
        details: offersData.categoryOffers,
      });
    } else {
      let updateResult = await Offer.updateOne(
        { _id: offerId },
        { $set: { unlist: true } }
      );
      let offersData = await offerHelpers.getproductCategoryOffer();
      res.json({
        status: true,
        message: "offer listed successfully",
        details: offersData.categoryOffers,
      });
    }
  } catch (error) {
    console.log("error", error);
  }
};



exports.editproductcategoryoffer = async (req, res) => {
  try {
    let user = req.session.user;
    let offerId = req.params.id;
    let offer = await Offer.findOne({ _id: offerId });
      let products = await adminHelpers.getAllProducts();
    console.log("offerid:", offer);
    res.render("admin/edit-productoffer", {
      user,
      admin: true,
      name: offer.offer_name,
      discount: offer.discount,
      id: offer._id,
      productsrg:offer.productId,
      valid_from: offer.valid_from.toISOString().substring(0, 16),
      valid_to: offer.valid_to.toISOString().substring(0, 16),
      products,
    });
  } catch (error) {
    console.log("error:", error);
  }
};

exports.editproductoffer = async (req, res) => {
  let offerId = req.params.id;
  console.log("id is:", offerId);
  console.log("body is:", req.body);
  let result = await offerHelpers.editproductOffer(offerId, req.body);
  let offersData = await offerHelpers.getproductCategoryOffer();
  if (result.error) {
    res.status(400).json({ message: result.errors});
  } else {
    res.status(200).json({ success: true ,offersData});
  }
};


exports.viewrefferaloffer=async(req,res)=>{
  let user = req.session.user;
  try {
    let offersData = await offerHelpers.getreferralOffer();
    if (offersData && Array.isArray(offersData.categoryOffers)) {
      const offers = offersData.categoryOffers;
      offers.forEach((offer) => {
        console.log("Offer name:", offer.offer_name);
      });
      res.render("admin/referraloffer-page", { user, admin: true, offers });
    } else {
      console.log("Offers data format is incorrect:", offersData);
    }
  } catch (error) {
    console.log("Error:", error);
  }
}


exports.addReferaloffer=async(req,res)=>{
    let user = req.session.user; 
    res.render("admin/add-referraloffer", { user, admin: true });
}


exports.addreferaloffer=async(req,res)=>{
     console.log("body:", req.body);
     try {
       let saveOffer = await offerHelpers.savereferalOffer(req.body);
       console.log("save:", saveOffer);
       if (saveOffer.errors) {
         res.status(400).json({ message: saveOffer.errors });
       } else {
         res.status(200).json({ success: true, response: saveOffer.newOffer });
       }
     } catch (error) {}
}





exports.editreferenceoffer = async (req, res) => {
  try {
    let user = req.session.user;
    let offerId = req.params.id;
    let offer = await Offer.findOne({ _id: offerId });
    console.log("offerid:", offer);
    res.render("admin/edit-referenceoffer", {
      user,
      admin: true,
      offer_name: offer.offer_name,
      discount: offer.discount,
      id: offer._id,
      valid_from: offer.valid_from.toISOString().substring(0, 16),
      valid_to: offer.valid_to.toISOString().substring(0, 16),
      referenceId: offer.referenceId,
      maxAmount: offer.maxAmount,
    });
  } catch (error) {
    console.log("error:", error);
  }
};


exports.editreferaloffer = async (req, res) => {
  let offerId = req.params.id;
  console.log("id is:", offerId);
  let result = await offerHelpers.editreferenceOffer(offerId, req.body);
  if (result.error) {
    res.status(400).json({ message: result.errors });
  } else {
    res.status(200).json({ success: true });
  }
};




exports.viewcouponModule=async(req,res)=>{
   let user = req.session.user;
    let couponData = await offerHelpers.getCOuponData();
    if (couponData && Array.isArray(couponData.coupon)) {
      const coupons = couponData.coupon;
      coupons.forEach((offer) => {
        console.log("Offer name:");
      });
    }
    console.log("coupons res:",couponData)
    res.render("admin/view-coupon", { user, admin: true,coupons:couponData.coupon});
}


exports.addCoupon=async(req,res)=>{
  try{
      let user = req.session.user;
      res.render("admin/add-coupon", { user, admin: true});
  }catch(error){
    console.log("add coupon error:",error)
  }
}


exports.addCouponForm=async(req,res)=>{
  try {
    let saveCoupon = await offerHelpers.saveCoupon(req.body);
    console.log("save:", saveCoupon);
    if (saveCoupon.errors) {
      res.status(400).json({ message: saveCoupon.errors });
    } else {
      res.status(200).json({ success: true, response: saveCoupon.newCoupon });
    }
  } catch (error) {
    console.log("add form coupon error:", error);
  }
}




exports.unlistcoupon = async (req, res) => {
  try {
    let couponId = req.params.id;
    let offer = await Coupon.find({ _id: couponId });
    if (offer[0].unlist) {
      let updateResult = await Coupon.updateOne(
        { _id: couponId },
        { $set: { unlist: false } }
      );
    let couponData = await offerHelpers.getCOuponData();

      res.json({
        status: true,
        message: "offer unlisted successfully",
        details: couponData.coupon,
      });
    } else {
      let updateResult = await Coupon.updateOne(
        { _id: couponId },
        { $set: { unlist: true } }
      );
          let couponData = await offerHelpers.getCOuponData();

      res.json({
        status: true,
        message: "offer listed successfully",
        details: couponData.coupon,
      });
    }
  } catch (error) {
    console.log("error", error);
  }
};


exports.editcouponform=async(req,res)=>{
     try {
       let user = req.session.user;
       let couponId = req.params.id;
       let coupon = await Coupon.findOne({ couponCode: couponId});
       console.log("offerid:",coupon);
       let data = {
         id: coupon._id,
         couponCode: coupon.couponCode,
         typeoffer: coupon.typeoffer,
         discount: coupon.discount,
         minAmount: coupon.minAmount,
         description: coupon.description,
       };
              console.log("offerid:", data);

       res.render("admin/edit-coupon", {
         user,
         admin: true,
         coupon:data,
        valid_from: coupon.valid_from.toISOString().substring(0, 16),
      valid_to: coupon.valid_to.toISOString().substring(0, 16)
       });
     } catch (error) {
       console.log("error:", error);
     }
}



exports.editcoupon=async(req,res)=>{
  let orderId = req.params.id;
  let result = await offerHelpers.editCoupon(orderId, req.body);
  console.log("result:",result)
  if (result.error) {
    res.status(400).json({ message: result.errors });
  } else {
    res.status(200).json({ success: true });
  }
}