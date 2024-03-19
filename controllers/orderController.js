var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const orderHelpers = require("../helpers/order-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Address = require("../models/address");
const profileHelpers = require("../helpers/profile-helpers");




//place order page
exports.placeOrder = async (req, res) => {
  try{
  req.session.order = true;
  let user = req.session.user;
  let address = await profileHelpers.addressFind(user._id);
  let total = await cartHelpers.getTotalAmount(user._id);
  let discount = await cartHelpers.getTotalDiscount(user._id);
  let amount=total-discount;
  if(amount<500){
   shippingCharge=true;
   total=amount+50;
  }else{
     shippingCharge=false;
   total=amount;

  }
  if(amount>1000){
     COD=false;
  }else{
     COD=true;
  }

  if(req.session.order){
  res.render("user/place-order", { user, total,address:address.total,discount,amount,amount,shippingCharge,COD });}
  else{
      res.redirect("/user");
  }
}catch(error){

}
};


exports.placeOrderaddress = async (req, res) => {
  let user = req.session.user;
  const address = await Address.find({ userId: user._id });
  let total = await cartHelpers.getTotalAmount(user._id);
    let discount = await cartHelpers.getTotalDiscount(user._id);
      let amount = total - discount;
      if (amount < 500) {
       shippingCharge = true;
       total=amount+50;
      } else {
       shippingCharge = false;
       total=amount;
      }
      if (amount>1000) {
         COD = false;
      } else {
         COD = true;
      }
  try{
    if(req.session.order){
      res.render("user/place-address-order", { user, total, address,discount,amount,COD,shippingCharge });}
      else{
          res.redirect("/user");
      }
  }catch(error){
    console.log("error is:",error)
  }
};




//place order form
exports.placeOrderform = async (req, res) => {
  console.log("form:", req.body);
  try{
  let user = req.session.user;
  let userid=user._id;
  let products = await orderHelpers.getCartProctList(user._id);
  let totalPrice = await cartHelpers.getTotalAmount(user._id);

  let saveaddress = await orderHelpers.saveAddress(req.body,user._id);

        let method = req.body["payment-method"];

  let couponApplicable = req.body["coupon-applicable"];;
  let appliedCoupon = req.body["applied-coupon"] || "";
  console.log("couponApplicable:", couponApplicable);
  console.log("appliedCoupon:", appliedCoupon);

  if (totalPrice > 1000) {
    req.body["payment-method"] = "ONLINE";
  }
  let discount = await cartHelpers.getTotalDiscount(user._id);

  let response = await orderHelpers.placeOrder(
    req.body,
    products,
    totalPrice,
    discount,
    couponApplicable,
    appliedCoupon,
    userid
  );
        if (response.errors) {
          res.json({ response });
        } else if(response.paymentMethod =='COD'){
          console.log(":success:",response);
            res.json({codsuccess:true, response });

    }else{orderHelpers.genereateRazopay(response.referenceNo, response.totalAmount).then((response) => {
      console.log("response is:",response);
       res.json({  response });
    });
    }
  }catch(error){
    console.log("error in save:",error)
  }
};



//place order form
exports.placeOrdersave = async (req, res) => {
  console.log("body:",req.body)
  let user = req.session.user;
  let addressId=req.body.selectedAddressId;
  let address = await Address.findById(addressId);
  let method = req.body.paymentMethod;
  let couponApplicable=req.body.couponApplicable;
  let appliedCoupon=req.body.appliedCoupon;
  let products = await orderHelpers.getCartProctList(address.userId);
  let totalPrice = await cartHelpers.getTotalAmount(address.userId);
  if(totalPrice>1000){
    req.body.paymentMethod= 'ONLINE'
  }
  let discount = await cartHelpers.getTotalDiscount(user._id);
  response=await  orderHelpers.saveOrder(address,method,products,totalPrice,discount,couponApplicable,appliedCoupon);
    if (response.errors) {
      res.json({ response });
    } else if (response.paymentMethod == "COD") {
      res.json({ codsuccess: true, response });
    } else {
      orderHelpers
        .genereateRazopay(response.referenceNo, response.totalAmount)
        .then((response) => {
         response.status = "pending";
           res.json({  response });
        });
    }
};


exports.orderSuccessPage = async (req, res) => {
  console.log("i am inside")
  req.session.order=false;
  let user = req.session.user;
  const orderId = req.query.orderId;

  let orderDetails = await orderHelpers.getOrderDetails(orderId);
  orderDetails = orderDetails.toObject();
  let name = orderDetails.address.firstName;
  formattedDate = orderDetails.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let details = {
    date: formattedDate,
    payment: orderDetails.paymentMethod,
    id: orderDetails.referenceNo,
    housename: orderDetails.address.houseName,
    town: orderDetails.address.townCity,
    postcode: orderDetails.address.postcodeZIP,
    actualamount: orderDetails.originalAmount,
    amount: orderDetails.totalAmount,
    phn: orderDetails.address.phone,
    status: orderDetails.status,
    discount: orderDetails.coupon || 0,
  };
   console.log("orderDetails:", details);
  res.render("user/order-succesfull", { user, orderDetails, name, details });
};


//get order success page
exports.orderSuccessPageid = async (req, res) => {
  let user = req.session.user;
  const referenceId = req.query.orderId;
  let orderDetails = await orderHelpers.getOrderDetailsid(referenceId);
  console.log("orderDetails:", orderDetails);
  let name = orderDetails.address.firstName;
   formattedDate = orderDetails.date.toLocaleDateString("en-US", {
     year: "numeric",
     month: "long",
     day: "numeric",
   });
   let details = {
     date: formattedDate,
     payment: orderDetails.paymentMethod,
     actualamount: orderDetails.originalAmount,
     id: orderDetails.referenceNo,
     housename: orderDetails.address.houseName,
     town: orderDetails.address.townCity,
     postcode: orderDetails.address.postcodeZIP,
     amount: orderDetails.totalAmount,
     phn: orderDetails.address.phone,
     status: orderDetails.status,
     discount: orderDetails.discount || 0,
   };
  res.render("user/order-succesfull", { user, orderDetails, name,details });
};


exports.orderfailedPage = async (req, res) => {
  let user = req.session.user;
  const order = req.params.id;
          await Cart.deleteOne({ userId: order});


  let orderDetails = await orderHelpers.getOrderDetailsid(order);

  console.log("orderDetails:", orderDetails.userId);
  res.render("user/order-failed", { user, id:orderDetails.userId});
};



exports.myOrderPage = async (req, res) => {
  try {
    let user = req.session.user;
    let userId = req.params.id;
    const orders = await orderHelpers.myOrderPage(userId);
    console.log("lengtho", orders);
    if (orders.length === 0) {
      res.redirect("/user/order-empty");
    }
    orders.forEach((order) => {
      order.formattedDate = order.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });
      for (let order of orders) {
        if(order.status=='delivered'){
          order.delivered=true; 
        }else{
          order.delivered = false; 

        }
      }
    
    console.log("oooo", orders);
    res.render("user/myOrderPage", { user, orders });
  } catch (error) {
    console.log(error)
  }
};


exports.vieworderProduct = async (req, res) => {
  let user = req.session.user;
  let orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (order.products && !order.cancelproducts) {
    console.log("i am inside 1")
    const orderedProducts = await orderHelpers.vieworderProduct(orderId);
        console.log("orderedProducts:", orderedProducts);
        res.render("user/view-order-products", {user,orderedProducts,cancelProducts:false});

  }
  else if (!order.cancelproducts && order.cancelproducts) {
    console.log("i am inside 2");

    const cancelProducts = await orderHelpers.viewcancelProduct(orderId);
    console.log("cancelProducts:", cancelProducts);
    res.render("user/view-order-products", {user,cancelProducts,orderedProducts:false});

  }else if (order.cancelproducts && order.cancelproducts) {
    console.log("i am inside 3");
    const orderedProducts = await orderHelpers.vieworderProduct(orderId);
    const cancelProducts = await orderHelpers.viewcancelProduct(orderId);
    console.log("orderedProducts:", orderedProducts);
    console.log("cancelProducts:", cancelProducts);
    res.render("user/view-order-products", {user,orderedProducts,cancelProducts,});
  }
};




exports.viewpendingProduct = async (req, res) => {
  let user = req.session.user;
  let orderId = req.params.id;
  const orderdet = await Order.findById(orderId);
    let response = await orderHelpers.getInvoive(orderdet.referenceNo);
  let address = {
    name: orderdet.address.firstName,
    house: orderdet.address.houseName,
    city: orderdet.address.townCity,
    state:orderdet.address.stateCounty,
    postcode:orderdet.address.postcodeZIP,
    email:orderdet.address.email,
  };
  const formattedDate = response.order.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let order = {
    date: formattedDate,
    payment: response.order.paymentMethod,
    id: response.order.referenceNo,
    subTotal: response.order.originalAmount,
    discount: response.order.discount + response.order.coupon,
    total: response.order.totalAmount,
  };
  if (response.order.shippingCharge) {
    order.shipping = 50;
    order.total = response.order.totalAmount + 50;
  }
  console.log("addtre:",address);
  console.log("oo:",order)
  res.render("user/view-pending-products", {
    user,
    order: order,
    address: address,
    products: response.products,
  });
};


exports.deliveredOrderPage = async (req, res) => {
  let user = req.session.user;
  let orderId = req.params.id;
  const order = await Order.findById(orderId);
    const orderedProducts = await orderHelpers.viewdeliveredOrder(orderId);
     if (!order || !order.delivereddate) {
       // Handle case where order is not found or delivered date is null
       console.log("Order not found or missing delivery date");
     }

     const formattedDate = order.delivereddate.toLocaleDateString("en-US", {
       year: "numeric",
       month: "long",
       day: "numeric",
     });
   orderedProducts.forEach((product) => {
     product.formattedDate = formattedDate;
     product.referenceId = order.referenceNo;
     product.payment = order.paymentMethod;
   });
        console.log("orderedProducts:", orderedProducts);

  console.log("order delL", order.referenceNo);
  res.render("user/view-delivered-order", {
    user,
    products: orderedProducts,id:orderId
  });
};



//remove order items
exports.removeOrderItem = async (req, res) => {
  const cartId = req.body.cart;
  const proId = req.body.product;
  const reason=req.body.reason;
  console.log(cartId, proId);
  response = await orderHelpers.orderItemRemove(cartId, proId,reason);

  console.log("response:",response);
  res.status(200).json({
    success: true,
    response:response,
  });
};


//order items
exports.orderempty = (req, res) => {
  let user = req.session.user;
  res.render("user/order-empty", { user });
};



exports.verifyPayment=async(req,res)=>{
  console.log("i am inside the verify payment")
 let user=req.session.user
  try{
  orderHelpers.verifyPayment(req.body,user._id).then(()=>{
    orderHelpers.changePaymentStatus(req.body.order.response.receipt).then(()=>{
      res.json({status:true,details:req.body})
    })
  }).catch((err)=>{
    console.log("error is catch error")
    res.json({status:false})
  })
  }catch(error){
    console.log("error:",error)
  }
}


exports.replaceOrderItem = async (req, res) => {
  const orderId = req.body.cart;
  const proId = req.body.product;
  const reason = req.body.reason;
  response = await orderHelpers.replaceorder(orderId, proId, reason);
  console.log("response:", response);
  res.status(200).json({
    success: true,
    response: response,
  });
};


exports.replaceProduct=async(req,res)=>{
  try{
    const orderId = req.params.id;
    response = await orderHelpers.replaceProduct(orderId);
    console.log("rp:", response);
     const formattedDate = response.order.delivereddate.toLocaleDateString("en-US", {
       year: "numeric",
       month: "long",
       day: "numeric",
     });
    if(response.error){

    }
    else{
      console.log("else:",response.order)
      let user = req.session.user;
      res.render("user/replace-success", {
        user,
        name: response.order.address.firstName,
        date: formattedDate,
        reason: response.order.reason,
        id: response.order.referenceNo,
      });
    }
  }catch(error){

  }

}



exports.returnOrderItem = async (req, res) => {
  console.log("cartId, proId");
  const orderId = req.body.cart;
  const proId = req.body.product;
  const reason = req.body.reason;
  response = await orderHelpers.returnorder(orderId, proId, reason);
  console.log("response:", response);
  res.status(200).json({
    success: true,
    response: response,
  });
};


exports.returnProduct = async (req, res) => {
   try {
     const orderId = req.params.orderid;
      const walletId = req.params.walletid;
     response = await orderHelpers.returnProduct(orderId);
     console.log("rp:", response);
     const formattedDate = response.order.delivereddate.toLocaleDateString(
       "en-US",
       {
         year: "numeric",
         month: "long",
         day: "numeric",
       }
     );
     if (response.error) {

     } else {
       console.log("else:", response.order);
       let user = req.session.user;
       res.render("user/return-success", {
         user,
         name: response.order.address.firstName,
         date: formattedDate,
         reason: response.order.reason,
         id: response.order.referenceNo,
       });
     }
   } catch (error) {}
 };


 exports.validateCoupon=async(req,res)=>{
  let coupon = req.body.couponCode;
  let amount =req.body.amount;
  response = await orderHelpers.validateCoupon(req,res,coupon,amount);
  console.log("valid:",response)
    res.status(200).json({
      success: true,
      response: response,
    });
 }


 exports.removeCoupon = async (req, res) => {
   let coupon = req.body.couponCode;
   response = await orderHelpers.removeCoupon(req, res, coupon);
   console.log("valid:", response);
   res.status(200).json({
     success: true,
     response: response,
   });
 };



 exports.viewinvoice=async(req,res)=>{
  try{
      let user = req.session.user;
      let orderId=req.params.id;
      console.log("id:",orderId);
      let response = await orderHelpers.getInvoive(orderId);
      let address = {
        name: response.order.address.firstName,
        house: response.order.address.houseName,
        city: response.order.address.townCity,
        state: response.order.address.stateCounty,
        postcode: response.order.address.postcodeZIP,
        email: response.order.address.email
      };
      const formattedDate = response.order.date.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
      
      let order = {
        date: formattedDate,
        payment: response.order.paymentMethod,
        id: response.order.referenceNo,
        subTotal: response.order.originalAmount,
        discount: response.order.discount + response.order.coupon,
        total:response.order.totalAmount,
      };
      if (response.order.shippingCharge) {
        order.shipping = 50;
        order.total = response.order.totalAmount+50;
      }
      console.log("address:",address)
      res.render("user/view-invoice", { user,address,products:response.products,order});
  }catch(error){
    console.log("invoice error:",error)
  }

 }


 exports.continuePayment=async(req,res)=>{
  console.log("heello");
  let orderId=req.params.id
    let order = await Order.findOne({ referenceNo: orderId });
    console.log("order",order)


  await orderHelpers
    .genereateRazopay(order.referenceNo, order.totalAmount)
    .then((response) => {
      response.status = "pending";
      res.json({ response });
    });
 }