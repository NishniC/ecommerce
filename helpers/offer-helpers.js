const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const Offer=require("../models/offer")
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Coupon = require("../models/coupon");
const Order = require("../models/order");
const Address = require("../models/address");
const Razorpay = require("razorpay");
var crypto = require("crypto");
const cron = require("node-cron");


const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = {
    offer_name: "",
    category: "",
    type: "",
    discount: "",
    valid_from: "",
    valid_to: "",
    maxAmount:""
  };
  //validation error
  if (err.message.includes("Offer validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  if (err.message.includes("Coupon validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};



const updateExpirationStatus = async () => {
  try {
    // Update expiration status for offers
    const expiredOffers = await Offer.updateMany(
      { valid_to: { $lt: new Date() }, expired: true },
      { $set: { expired: false } }
    );

    // Update expiration status for coupons
    const expiredCoupons = await Coupon.updateMany(
      { valid_to: { $lt: new Date() }, expired: true },
      { $set: { expired: false } }
    );


  } catch (error) {
    console.error("Error updating expiration status:", error);
  }
};

const formatDateTime = (dateTime) => {
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  return new Date(dateTime).toLocaleString("en-US", options);
};


const isOfferValid = (offer) => {
  const currentDate = new Date();
  return currentDate >= offer.valid_from && currentDate <= offer.valid_to;
};


cron.schedule("* * * * *", updateExpirationStatus);
exports.saveOfferCategory = async (details) => {
  const newOffer = new Offer({
    offer_name: details.offer_name,
    type: "category",
    typeoffer: details.typeoffer,
    category: details.Category,
    discount: details.discount,
    valid_from: details.valid_from,
    valid_to: details.valid_to,
  });
  try{
    await newOffer.validate();
     await newOffer.save();
     await Products.updateMany(
       { Category: { $in: details.category || [] } },
       { $set: { discount: details.discount } }
     );
     let products = await Products.findOne({
       Category: { $in: details.category || [] },
     });
     console.log("New product:", products);

     return { newOffer};
  }catch(error){
        const errors = handleErrors(error);
        return{errors}
  }
};


exports.getCategoryOffer = async () => {
  try {
    const categoryOffers = await Offer.aggregate([
      { $match: { type: "category" } },
      
      {
        $project: {
          _id: 1,
          offer_name: 1,
          type: 1,
          typeoffer: 1,
          discount: 1,
          category: 1,
          unlist: 1,
          valid_from: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_from" },
          },
          valid_to: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_to" },
          },
        },
      },
    ]);
    const formattedCategoryOffers = categoryOffers.map((offer) => {
      const isValid = isOfferValid(offer);
      return {
        ...offer,
        expired: !isValid,
      };
    });
    console.log("Formatted category offers:", formattedCategoryOffers);
    return { categoryOffers: formattedCategoryOffers };
  } catch (error) {
    console.error("Error fetching category offers:", error);
    return { error };
  }
};


exports.listCategory=async (offerId)=>{
  try{
        const result = await collection.updateOne(
          { _id: ObjectId(offerId) }, // Filter criteria to find the offer by its ID
          { $set: { list: false } } // Update operation to set the 'list' field to false
        );
          console.log("offer:",result)
          return{result}
  }catch(error){

  }
}


exports.editOfferCategory = async (offerId,details) => {
  try {
    console.log("id:", offerId);
 let updateObj = {
      offer_name: details.offer_name,
      category: details.category,
      typeoffer: details.typeoffer,
      discount: parseInt(details.discount), 
      valid_from: new Date(details.valid_from),
      valid_to: new Date(details.valid_to)
    };
    let updatedOffer = await Offer.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId.createFromHexString(offerId) },
      updateObj,
      { new: true } 
    );
    return {updatedOffer}; 
  } catch (error) {
    console.log("error:", error);
  }
};



exports.saveOfferproductCategory = async (details) => {
  const newOffer = new Offer({
    offer_name: details.offer_name,
    type: "product",
    typeoffer: details.typeoffer,
    productId: details.Category || null,
    discount: details.discount,
    valid_from: details.valid_from,
    valid_to: details.valid_to,
  });
  try {
    await newOffer.validate();
    await newOffer.save();
    for (const categoryName of details.Category) {
      // Update products matching the categoryName with the offer discount
      await Products.updateMany(
        { Name: categoryName },
        { $set: { discount: details.discount } }
      );
    }

  
    return { newOffer };
  } catch (error) {
    const errors = handleErrors(error);
    return { errors };
  }
};


exports.getproductCategoryOffer = async () => {
  try {
    const categoryOffers = await Offer.aggregate([
      { $match: { type: "product" } },
      {
        $project: {
          _id: 1,
          offer_name: 1,
          type: 1,
          typeoffer: 1,
          productId: 1,
          discount: 1,
          unlist: 1,
          valid_from: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_from" },
          },
          valid_to: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_to" },
          },
        },
      },
    ]);
    const formattedCategoryOffers = categoryOffers.map((offer) => {
      const isValid = isOfferValid(offer);
      return {
        ...offer,
        expired: !isValid,
      };
    });
    console.log("Formatted category offers:", formattedCategoryOffers);
    return { categoryOffers: formattedCategoryOffers };
  } catch (error) {
    console.error("Error fetching category offers:", error);
    return { error };
  }
};




exports.editproductOffer = async (offerId, details) => {
  try {
    console.log("id:", offerId);
    let updateObj = {
      offer_name: details.offer_name,
      productId: details.Category,
      typeoffer: details.typeoffer,
      discount: parseInt(details.discount),
      valid_from: new Date(details.valid_from),
      valid_to: new Date(details.valid_to),
    };

    let updatedOffer = await Offer.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId.createFromHexString(offerId) },
      updateObj,
      { new: true }
    );

    console.log("Updated offer:", updatedOffer);
    return { updatedOffer };
  } catch (error) {
    console.log("error:", error);
  }
};



exports.savereferalOffer = async (details) => {

  try {
  const newOffer = new Offer({
    offer_name: details.offer_name,
    type: "referal code",
    typeoffer: details.typeoffer,
    referenceId: details.ref_code || null,
    discount: details.discount,
    valid_from: details.valid_from,
    valid_to: details.valid_to,
    maxAmount: details.min_amount,
  });
  console.log("ref:",newOffer);

  const refCodeRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/;
  
  
    await newOffer.validate();
    if (!refCodeRegex.test(newOffer.referenceId)) {
      return {
        errors: {
          referenceId:
            "Reference ID must be 6 characters long and contain both letters and numbers",
        },
      };
    }
    await newOffer.save();
    console.log("New product:", newOffer);

    return { newOffer };
  } catch (error) {
    console.log("error:",error)
    const errors = handleErrors(error);
    return { errors };
  }
};



exports.getreferralOffer = async () => {
  try {
    const categoryOffers = await Offer.aggregate([
      { $match: { type: "referal code" } },
      {
        $project: {
          _id: 1,
          offer_name: 1,
          type: 1,
          maxAmount:1,
          typeoffer: 1,
          discount: 1,
          referenceId: 1,
          unlist: 1,
          valid_from: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_from" },
          },
          valid_to: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_to" },
          },
        },
      },
    ]);
    const formattedCategoryOffers = categoryOffers.map((offer) => {
      const isValid = isOfferValid(offer);
      return {
        ...offer,
        expired: isValid,
      };
    });
    console.log("Formatted category offers:", formattedCategoryOffers);
    return { categoryOffers: formattedCategoryOffers };
  } catch (error) {
    console.error("Error fetching category offers:", error);
    return { error };
  }
};



exports.editreferenceOffer = async (offerId, details) => {
  try {
    console.log("id:", offerId);
    let updateObj = {
      offer_name: details.offer_name,
      type: "referal code",
      typeoffer: details.typeoffer,
      referenceId: details.ref_code,
      discount: details.discount,
      valid_from: details.valid_from,
      valid_to: details.valid_to,
      maxAmount: details.min_amount,
    };

    let updatedOffer = await Offer.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId.createFromHexString(offerId) },
      updateObj,
      { new: true }
    );
    console.log("Updated offer:", updatedOffer);
    return { updatedOffer };
  } catch (error) {
    console.log("error:", error);
  }
};




exports.saveCoupon = async (details) => {
  console.log("details",details)
  const newCoupon = new Coupon({
    couponCode: details.coupon_code,
    description: details.description,
    typeoffer:details.typeoffer,
    discount: details.discount,
    valid_from: details.valid_from,
    valid_to: details.valid_to,
    minAmount: details.minimum_amount,
  });
  try {
    await newCoupon.validate();
    await newCoupon.save();

    return { newCoupon };
  } catch (error) {
    const errors = handleErrors(error);
    return { errors };
  }
};



exports.getCOuponData=async()=>{
  try {
    const coupons = await Coupon.aggregate([
      {
        $project: {
          _id: 1,
          couponCode: 1,
          description: 1,
          typeoffer: 1,
          discount: 1,
          minAmount: 1,
          expired: 1,
          unlist: 1,
          usedUser: 1,
          valid_from: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_from" },
          },
          valid_to: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_to" },
          },
        },
      },
    ]);
    const formattedCoupon = coupons.map((coupon) => {
      const isValid = isOfferValid(coupon);
      return {
        ...coupon,
        expired: isValid,
      };
    });
    console.log("Formatted category offers:", formattedCoupon);
    return { coupon: formattedCoupon};
  } catch (error) {
    console.error("Error fetching category offers:", error);
    return { error };
  }
}




exports.editCoupon = async (offerId, details) => {
  try {

    let updateObj = {
      couponCode: details.coupon_code,
      description: details.description,
      typeoffer: details.typeoffer,
      discount: details.discount,
      valid_from: details.valid_from,
      valid_to: details.valid_to,
      minAmount: details.minimum_amount,
    };
    let updatedOffer = await Coupon.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId.createFromHexString(offerId) },
      updateObj,
      { new: true }
    );
    return { updatedOffer };
  } catch (error) {
    console.log("error:", error);
  }
};