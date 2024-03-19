const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const Address = require("../models/address");
const Razorpay = require("razorpay");
var crypto = require("crypto");
const Wallet = require("../models/wallet");
const Offer = require("../models/offer");
const Coupon = require("../models/coupon");
const { match } = require("assert");

var instance = new Razorpay({
  key_id: "rzp_test_RL5JDiKZOe7ZgJ",
  key_secret: "IxX7YnyNlOTMpNH6APHFV9mM",
});


const generateRandomNumber = () => {
  let result = "";

  for (let i = 0; i < 8; i++) {
    const randomNumber = Math.floor(Math.random() * 10); // Generates a random number between 0 and 9
    result += randomNumber.toString();
  }

  return result;
};


const handleOrderErrors = (err) => {
  console.log("Error object:", err); // Log the entire error object for inspection
  console.log("message", err.message);
  let errors = {
    paymentMethod: "select your payment method",
    address: {
      firstName: "",
      houseName: "",
      townCity: "",
      stateCounty: "",
      postcodeZIP: "",
      phone: "",
      email: "",
    },
  };

  if (err.errors) {
    Object.entries(err.errors).forEach(([key, value]) => {
      const pathParts = key.split(".");

      if (pathParts.length === 2) {
        const [parent, field] = pathParts;
        if (parent === "address") {
          errors.address[field] = value.message || `${field} is required`;
        } else if (parent === "paymentMethod") {
          errors.paymentMethod = value.message || "Select your payment method";
        }
      }
    });
  }

  console.log("Handled errors:", errors);
  return errors;
};



const handleaddressErrors = (err) => {
  console.log("Error object:", err); // Log the entire error object for inspection
  console.log("message", err.message);
  let errors = {
      firstName: "",
      houseName: "",
      townCity: "",
      stateCounty: "",
      postcodeZIP: "",
      phone: "",
      email: "",
  };

  if (err.message.includes("Address validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  console.log("Handled errors:", errors);
  return errors;
};

//get cart products
exports.getCartProctList = (userId) => {
  console.log("id", userId);
  return new Promise(async (resolve, reject) => {
    let cart = await Cart.findOne({ userId: userId });
    resolve(cart.productId);
  });
};

// post place order form
exports.placeOrder = async (
  order,
  products,
  total,
  discount,
  couponApplicable,
  appliedCoupon,
  userid
) => {
  try {
    console.log("Order details:", order, products, total);
    const randomString = generateRandomNumber();
    console.log(" user id:", userid);

    let status = order["payment-method"] === "COD" ? "placed" : "pending";

    let orderObj = new Order({
      address: {
        firstName: order.fname,
        houseName: order.housename,
        townCity: order.city,
        stateCounty: order.state,
        postcodeZIP: order.postcode,
        phone: order.phone,
        email: order.email,
      },
      products: products,
      totalAmount: total,
      referenceNo: randomString,
      userId: userid,
      paymentMethod: order["payment-method"],
      status: status,
      discount: discount,
    });

    if (couponApplicable) {
      const coupon = await Coupon.findOne({ couponCode: appliedCoupon });
      if (coupon) {
        orderObj.coupon = coupon.discount; // Update the discount in the order object
        orderObj.totalAmount = total - coupon.discount;
      }
    }
    if (total < 500) {
      orderObj.shippingCharge = 50; // Update the discount in the order object
    }
    console.log("Order object:", orderObj);

    // Create the order
    const response = await Order.create(orderObj);

    if (response.paymentMethod == "COD") {
      await Cart.deleteOne({ userId: orderObj.userId });
    }
    console.log("Order added successfully:",orderObj);

    return orderObj; // Resolve with the created order object
  } catch (error) {
    console.error("Error placing order:", error.message);
    const errors = handleOrderErrors(error);
    console.log("Order validation errors:", errors);
    return { errors };
  }
};



  exports.saveOrder = async (address,method,products,total,discount,couponApplicable,appliedCoupon) => {
    try {
      console.log(address, method, products, total);
      let status = method === "COD" ? "placed" : "pending";
      const randomString = generateRandomNumber();
      console.log(randomString);

      let orderObj = new Order({
        address: {
          firstName: address.firstName,
          houseName: address.houseName,
          townCity: address.townCity,
          stateCounty: address.stateCounty,
          postcodeZIP: address.postcodeZIP,
          phone: address.phone,
          email: address.email,
        },
        products: products,
        totalAmount: total,
        originalAmount:total,
        userId: address.userId,
        referenceNo: randomString,
        paymentMethod: method,
        status: status,
        discount: discount,
      });


      if (couponApplicable) {
        const coupon = await Coupon.findOne({ couponCode: appliedCoupon });
        if (coupon) {
          orderObj.coupon = coupon.discount; // Update the discount in the order object
          orderObj.totalAmount = total - coupon.discount;
        }
      }
      if (total<500) {
        orderObj.shippingCharge = 50; // Update the discount in the order object
      }
      console.log("Order object:", orderObj);
      const response = await Order.create(orderObj);
      console.log("ress:", response);
      if (response.paymentMethod == "COD") {
        await Cart.deleteOne({ userId: orderObj.userId });
      }
      console.log("Order added successfully");
      return orderObj;
    } catch (error) {
      console.error("Error placing order:", error.message);
      const errors = handleOrderErrors(error);
      console.log("Order validation errors:", errors);
      return { errors };
    }
  };


//get orderdetails
exports.getOrderDetails = async (orderId) => {
  let order = await Order.findOne({
    _id: mongoose.Types.ObjectId.createFromHexString(orderId),
  });
  console.log("ghhhh", order);
  return order;
};


exports.getOrderDetailsid = async (orderId) => {
  let order = await Order.findOne({
    referenceNo: orderId,
  });
  console.log("ghhhh", order);
  return order;
};


//get my order page
exports.myOrderPage= async (userId)=>{
  try{

const orders = await Order.aggregate([
  {
    $match: { userId: userId },
  },
]);
  console.log("order",orders);
  return orders;

  }catch(error){
        console.error("Error getting order:", error);

  }
}

//view order products
exports.vieworderProduct = async (orderId) => {
  try {
    const orderItems = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: "$products.item",
          quantity: "$products.quantity",
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
    ]);
    console.log("order items", orderItems);
    return orderItems;
  } catch (error) {
    console.log("err:", error);
  }
};

//view order products
exports.viewcancelProduct = async (orderId) => {
  console.log("iam inside viewcancel product")
  try {
    const cancelItems = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      },
      {
        $unwind: "$cancelproducts",
      },
      {
        $project: {
          item: "$cancelproducts.id",
          reason: "$cancelproducts.reason",
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
          reason: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
    ]);
    console.log("cancel items", cancelItems);
    return cancelItems;
  } catch (error) {
    console.log("err:", error);
  }
};



//remove order item 
exports.orderItemRemove = async (orderId, proId,reason) => {
const cancelItem={id:proId,reason:reason}
  await Order.updateOne(
    { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
    { $pull: { products: { item: proId } } },
  );

    await Order.updateOne(
      { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      { $push: { cancelproducts: cancelItem } }
    );
    await Order.updateOne(
      { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      { $set:{reason:reason} }
    );
  const order = await Order.findById(orderId);
  console.log("order : ",order)
  if(order.products){
   isProductsEmpty = order.products.length === 0;}
  if (order.cancelproducts) {
     isCancelEmpty = order.cancelproducts.length === 0;
  }
    if (isProductsEmpty) {
      await Order.updateOne(
        { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
        { $unset: { products: 1 } }
      );
    }

  if (isCancelEmpty) {
    await Order.updateOne(
      { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      { $unset: { cancelproducts: 1 } }
    );
  }
  try{
       if (order.paymentMethod === "ONLINE") {
         // Calculate total refunded amount
          let totalReturnedAmount = order.totalAmount;
          let userWallet = await Wallet.findOne({ userId: order.userId });
          if (!userWallet) {
            try {
                      console.log("innnnnnnnsdfg");

              userWallet = await Wallet.create({
                userId: order.userId,
                balance: 0,
              });
            } catch (error) {
              console.log("err:", error);
            }
          }
          userWallet.balance += totalReturnedAmount;
          await userWallet.save();
                        console.log("ewaaa:", userWallet);

       }


  }catch(error){
    console.log("err;",error)
  }
  return {order,isProductsEmpty,isCancelEmpty};
};





exports.saveAddress=async(order,id)=>{
  try{
      let address = new Address({
          firstName: order.fname,
          houseName: order.housename,
          townCity: order.city,
          stateCounty: order.state,
          postcodeZIP: order.postcode,
          phone: order.phone,
          email: order.email,
        userId: id,
      });
      await address.validate();
    const response = await Address.create(address);
    return response;
  }catch(error){
        console.log("error is :",error)
        const errors = handleaddressErrors(error);
        console.log("address validation errors:", errors);
        return { errors };
  }

}


exports.genereateRazopay=async(id,price)=>{
  return new Promise((resolve,reject)=>{
    var options={
      amount:price*100,
      currency:"INR",
      receipt:id
    };
    instance.orders.create(options,function(err,order){
      console.log("neworder:",order);
      resolve(order)
    })
  })
}


exports.verifyPayment=(details,userId)=>{
    return new Promise(async(resolve,reject)=>{
    await Cart.deleteOne({ userId: userId });
    var hmac = crypto.createHmac("sha256", "IxX7YnyNlOTMpNH6APHFV9mM");
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    hmac=hmac.digest('hex')
    console.log("hmac:",hmac)
    console.log("detailed:", details.payment.razorpay_signature);
    if (hmac == details.payment.razorpay_signature) {
      
      console.log("user online payment success:",userId)
      resolve();
    } else {
      reject();
    }
  })
}


exports.changePaymentStatus=async(orderId)=>{
        console.log(" iam inside order change payment:");
  return new Promise(async (resolve,reject)=>{
      let order = await Order.findOne({ referenceNo:orderId });
      console.log("order change payment:",order);
      await Order.updateOne(
        { referenceNo: orderId },
        { $set: { status: "placed" } }
      ).then(async()=>{
        let order = await Order.findOne({ referenceNo:orderId });
      console.log("order:",order);
        resolve()
      })
  })
}




exports.viewdeliveredOrder = async (orderId) => {
  try {
    const orderItems = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: "$products.item",
          quantity: "$products.quantity",
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
    ]);
    console.log("order items", orderItems);
    return orderItems;
  } catch (error) {
    console.log("err:", error);
  }
};

exports.replaceorder=async (orderId, proId, reason)=>{
            await Order.updateOne(
              { referenceNo: orderId },
              { $set: { orderstatus: "replace" } }
            );
       await Order.updateOne(
         { referenceNo: orderId },
         { $set: { reason: reason } }
       );

      let order = await Order.findOne({ referenceNo: orderId });
            return{order,success:true}
}


exports.replaceProduct=async(orderId)=>{
  try{
        let order = await Order.findOne({ referenceNo: orderId });
        return{order}

  }catch(error){
    return{error}
  }
}



exports.returnorder = async (orderId, proId, reason) => {
  await Order.updateOne(
    { referenceNo: orderId },
    { $set: { orderstatus: "return" } }
  );
  await Order.updateOne({ referenceNo: orderId }, { $set: { reason: reason } });

  let order = await Order.findOne({ referenceNo: orderId });
  return { order, success: true };
};


exports.returnProduct = async (orderId) => {
  try {
    let order = await Order.findOne({ referenceNo: orderId });
    console.log("retun: ",order)
  let totalReturnedAmount = 0;
  for (const product of order.products) {
    // Assuming each product has a price property
    let productPrice = await Products.findById(product.item);
    totalReturnedAmount += product.quantity * productPrice.price;
  }
  let userWallet = await Wallet.findOne({ userId: order.userId });
       if (!userWallet) {
         try {
           userWallet = await Wallet.create({
             userId: order.userId,
             balance: 0,
             transactionHistory: [], // Initialize transaction history
           });
         } catch (error) {
           console.log("err:", error);
         }
       }
     userWallet.balance += totalReturnedAmount;
     userWallet.transactionHistory.push({
       name: `Returned order id:${orderId}`,
       type: "credit",
       amount: totalReturnedAmount,
       timestamp: new Date(),
     });
     await userWallet.save();
     console.log("user Wallet:",userWallet)
     return { order, totalReturnedAmount,userWallet};
  } catch (error) {
    return { error };
  }
};



exports.validateCoupon=async(req,res,coupon,amount)=>{
        let user = req.session.user;
   const referralOffers = await Coupon.find();
  console.log("coupon is",referralOffers)
   const matchedOffer = referralOffers.find(
     (offer) => offer.couponCode === coupon
   );
     console.log("match", matchedOffer);
     if(matchedOffer){
      if (matchedOffer.usedUser && matchedOffer.usedUser.includes(user._id)) {
        
        return { error: "Coupon has already been used by the same user" };
      } else if(matchedOffer.minAmount > amount){
          return {
            error:
              "Coupon applicable only the minimumamount shouls be " +matchedOffer.minAmount,
          };
      }else {
        await Coupon.findByIdAndUpdate(matchedOffer._id, {
          $push: { usedUser:user._id },
        });
        return { matchedOffer ,valid:true};
      }
     }
     else{
      return {errors:"coupon is invalid"}
     }

}


exports.removeCoupon = async (req, res, couponCode) => {
  try {
    // Find the offer associated with the given coupon code
    const offer = await Coupon.findOne({ couponCode: couponCode });
    console.log("gggg",offer)
    if (!offer) {
      return { error: "Offer not found" };
    }
    let user = req.session.user;
    const userIdToRemove = user._id; // Assuming you have access to the user ID from the request
      const updateResult = await Coupon.updateOne(
        { _id: offer._id },
        { $pull: { usedUser: userIdToRemove } }
      );

    return { message: "User removed from usedBy array successfully" };
  } catch (error) {
    console.error("Error removing user from usedBy array:", error);
    return { error: "An error occurred while removing user from usedBy array" };
  }
};


exports.getInvoive=async(orderId)=>{
  try{
    let order = await Order.findOne({ referenceNo: orderId });
        console.log("order invoice:", order);
        let products = await Order.aggregate([
          {
            $match: { referenceNo: orderId },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
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
              name: { $arrayElemAt: ["$product.Name", 0] }, // Access the first element of the array
              price: { $arrayElemAt: ["$product.price", 0] }, // Access the first element of the array
              quantity: "$quantity",
              totalProductPrice: {
                $multiply: [
                  { $arrayElemAt: ["$product.price", 0] },
                  { $toInt: "$quantity" },
                ],
              },
            },
          },
        ]);
        console.log("product :", products);
        return {products,order}


  }catch(error){
    console.log("error getinvoicse:",error)
  }
}