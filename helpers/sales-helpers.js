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



exports.viewdailySalesReport = async () => {
    try{
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const todayDateString = `${year}-${month}-${day}`;

  const result = await Order.aggregate([
    {
      $match: {
        status: "delivered",
        date: {
          $gte: new Date(todayDateString), 
          $lt: new Date(todayDateString + "T23:59:59"), 
        },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $addFields: {
        itemId: { $toObjectId: "$products.item" },
      },
    },
    {
      $lookup: {
        from: "products", 
        localField: "itemId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
  ]);
  return {result}
    }catch(error){
        return {error}
    }
};
  

exports.viewproductsalesReport= async ()=>{
    
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
      const day = String(today.getDate()).padStart(2, "0");

      const todayDateString = `${year}-${month}-${day}`;

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            date: {
              $gte: new Date(todayDateString), // Find orders with date greater than or equal to today
              $lt: new Date(todayDateString + "T23:59:59"), // Find orders with date less than today's end
            },
          },
        },
        {
          $unwind: "$products",
        },
        {
          $addFields: {
            itemId: { $toObjectId: "$products.item" },
          },
        },
        {
          $lookup: {
            from: "products", // Collection name for products
            localField: "itemId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $group: {
            _id: "$products.item",
            productName: {
              $first: { $arrayElemAt: ["$productDetails.Name", 0] },
            },
            discount: {$first: { $arrayElemAt: ["$productDetails.discount", 0] },},
            quantitySold: { $sum: "$products.quantity" },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);
      return { result };
    };



exports.viewusersalesReport = async () => {
try {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const todayDateString = `${year}-${month}-${day}`;

  const result = await Order.aggregate([
    {
      $match: {
        status: "delivered",
        date: {
          $gte: new Date(todayDateString),
          $lt: new Date(todayDateString + "T23:59:59"),
        },
      },
    },
    {
      $addFields: {
        user: { $toObjectId: "$userId" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
    },
      },
      {
  $unwind: "$userDetails",
},
{
  $project: {
    referenceNo: 1,
    discount:1,
    coupon:1,
    username: "$userDetails.firstName",
    email: "$userDetails.email",
    price: "$totalAmount",
    paymentMethod: 1,
    status: 1,
    _id: { $toString: "$_id" }, // Convert _id to string
  },

    },
  ]);

  return { result };
} catch (error) {
    console.log("error:",error)
  return { error };
}
};


exports.overallTotalToday = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDateString = `${year}-${month}-${day}`;

    const result = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(todayDateString),
            $lt: new Date(todayDateString + "T23:59:59"),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$totalAmount",
                else: 0,
              },
            },
          },
          totaldiscount: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$discount",
                else: 0,
              },
            },
          },
          totalCoupon: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$coupon",
                else: 0,
              },
            },
          },
          successfulOrders: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: 1,
                else: 0,
              },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const totalSales = result[0].totalSales;
      const totalDiscount = result[0].totaldiscount;
      const totalCoupon = result[0].totalCoupon;
      const successfulOrders = result[0].successfulOrders;
      const totalOrders = result[0].totalOrders;
      const averageOrderValue =
        successfulOrders > 0 ? totalSales / successfulOrders : 0;

      return {
        totalSales,
        successfulOrders,
        totalOrders,
        totalCoupon,
        totalDiscount,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      };
    } else {
      return {
        totalSales: 0,
        successfulOrders: 0,
        totalCoupon:0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalDiscount:0,
      };
    }
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};


exports.viewWeeklySalesReport = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDateString = `${year}-${month}-${day}`;
    const firstDayOfWeek = new Date(
      today.setDate(
        today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
      )
    ); 

    const result = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          date: {
            $gte: new Date(firstDayOfWeek),
            $lt: new Date(todayDateString + "T23:59:59"),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$products.item",
          productName: {
            $first: { $arrayElemAt: ["$productDetails.Name", 0] },
          },
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    return { result };
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};


exports.viewWeeklyproductsalesReport = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDateString = `${year}-${month}-${day}`;
    const firstDayOfWeek = new Date(
      today.setDate(
        today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
      )
    );

  const result = await Order.aggregate([
    {
      $match: {
        status: "delivered",
        date: {
          $gte: new Date(firstDayOfWeek),
          $lt: new Date(todayDateString + "T23:59:59"),
        },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $addFields: {
        itemId: { $toObjectId: "$products.item" },
      },
    },
    {
      $lookup: {
        from: "products", // Collection name for products
        localField: "itemId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $group: {
        _id: "$products.item",
        productName: { $first: { $arrayElemAt: ["$productDetails.Name", 0] } },
        discount: { $first: { $arrayElemAt: ["$productDetails.discount", 0] } },
        quantitySold: { $sum: "$products.quantity" },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);
  return { result };
};





exports.viewweeklyusersalesReport = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDateString = `${year}-${month}-${day}`;
    const firstDayOfWeek = new Date(
      today.setDate(
        today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
      )
    );

    const result = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          date: {
            $gte: new Date(firstDayOfWeek),
            $lt: new Date(todayDateString + "T23:59:59"),
          },
        },
      },
      {
        $addFields: {
          user: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          referenceNo: 1,
          username: "$userDetails.firstName",
          email: "$userDetails.email",
          price: "$totalAmount",
          discount:1,
          paymentMethod: 1,
          status: 1,
          coupon:1,
          _id: { $toString: "$_id" }, // Convert _id to string
        },
      },
    ]);

    return { result };
  } catch (error) {
    console.log("error:", error);
    return { error };
  }
};



exports.overallTotalweek = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDateString = `${year}-${month}-${day}`;
    const firstDayOfWeek = new Date(
      today.setDate(
        today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
      )
    );
    const result = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(firstDayOfWeek),
            $lt: new Date(todayDateString + "T23:59:59"),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$totalAmount",
                else: 0,
              },
            },
          },
          totaldiscount: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$discount",
                else: 0,
              },
            },
          },
          totalCoupon: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$coupon",
                else: 0,
              },
            },
          },
          successfulOrders: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: 1,
                else: 0,
              },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const totalSales = result[0].totalSales;
      const totalDiscount = result[0].totaldiscount;
      const totalCoupon = result[0].totalCoupon;
      const successfulOrders = result[0].successfulOrders;
      const totalOrders = result[0].totalOrders;
      const averageOrderValue =
        successfulOrders > 0 ? totalSales / successfulOrders : 0;

      return {
        totalSales,
        totalDiscount,
        successfulOrders,
        totalCoupon,
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      };
    } else {
      return {
        totalSales: 0,
        totalDiscount:0,
        totalCoupon:0,
        successfulOrders: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      };
    }
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};




exports.viewYearlySalesReport = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1); // First day of the current year

    const result = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          date: {
            $gte: firstDayOfYear,
            $lt: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() + 1
            ), // Today's date
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$products.item",
          productName: {
            $first: { $arrayElemAt: ["$productDetails.Name", 0] },
          },
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    return { result };
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};




exports.viewyearlyproductsalesReport = async () => {
 const today = new Date();
 const year = today.getFullYear();
 const firstDayOfYear = new Date(year, 0, 1); 

  const result = await Order.aggregate([
    {
      $match: {
        status: "delivered",
        date: {
          $gte: firstDayOfYear,
          $lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
          ),
        },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $addFields: {
        itemId: { $toObjectId: "$products.item" },
      },
    },
    {
      $lookup: {
        from: "products", // Collection name for products
        localField: "itemId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $group: {
        _id: "$products.item",
        productName: { $first: { $arrayElemAt: ["$productDetails.Name", 0] } },
        discount: { $first: { $arrayElemAt: ["$productDetails.discount", 0] } },
        quantitySold: { $sum: "$products.quantity" },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);
  return { result };
};






exports.viewyearlyusersalesReport = async () => {
  try {
 const today = new Date();
 const year = today.getFullYear();
 const firstDayOfYear = new Date(year, 0, 1); 

    const result = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          date: {
            $gte: firstDayOfYear,
            $lt: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() + 1
            ),
          },
        },
      },
      {
        $addFields: {
          user: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          referenceNo: 1,
          username: "$userDetails.firstName",
          email: "$userDetails.email",
          price: "$totalAmount",
          discount: 1,
          paymentMethod: 1,
          status: 1,
          coupon:1,
          _id: { $toString: "$_id" }, // Convert _id to string
        },
      },
    ]);

    return { result };
  } catch (error) {
    console.log("error:", error);
    return { error };
  }
};



exports.overallTotalyear = async () => {
  try {
 const today = new Date();
 const year = today.getFullYear();
 const firstDayOfYear = new Date(year, 0, 1); 

    const result = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: firstDayOfYear,
            $lt: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() + 1
            ),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$totalAmount",
                else: 0,
              },
            },
          },
          totaldiscount: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$discount",
                else: 0,
              },
            },
          },
          totalCoupon: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$coupon",
                else: 0,
              },
            },
          },
          successfulOrders: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: 1,
                else: 0,
              },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const totalSales = result[0].totalSales;
      const totalDiscount = result[0].totaldiscount;
      const totalCoupon = result[0].totalCoupon;
      const successfulOrders = result[0].successfulOrders;
      const totalOrders = result[0].totalOrders;
      const averageOrderValue =
        successfulOrders > 0 ? totalSales / successfulOrders : 0;

      return {
        totalSales,
        successfulOrders,
        totalOrders,
        totalCoupon,
        totalDiscount,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      };
    } else {
      return {
        totalSales: 0,
        successfulOrders: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalDiscount:0,
        totalCoupon:0
      };
    }
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};




exports.viewcustomersSalesReport= async(date)=>{
    try {
      const fromDate = new Date(date.fromDate);
      const toDate = new Date(date.toDate);

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            date: {
              $gte: fromDate,
              $lt: new Date(
                toDate.getFullYear(),
                toDate.getMonth(),
                toDate.getDate() + 1
              ),
            },
          },
        },
        {
          $unwind: "$products",
        },
        {
          $addFields: {
            itemId: { $toObjectId: "$products.item" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "itemId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $group: {
            _id: "$products.item",
            productName: {
              $first: { $arrayElemAt: ["$productDetails.Name", 0] },
            },
            quantitySold: { $sum: "$products.quantity" },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);
      return {result}
    } catch (error) {
      console.log("Error:", error);
    }
}




exports.viewcustomproductsalesReport = async (date) => {
  const fromDate = new Date(date.fromDate);
  const toDate = new Date(date.toDate);

  const result = await Order.aggregate([
    {
      $match: {
        status: "delivered",
        date: {
          $gte: fromDate,
          $lt: new Date(
            toDate.getFullYear(),
            toDate.getMonth(),
            toDate.getDate() + 1
          ),
        },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $addFields: {
        itemId: { $toObjectId: "$products.item" },
      },
    },
    {
      $lookup: {
        from: "products", // Collection name for products
        localField: "itemId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $group: {
        _id: "$products.item",
        productName: { $first: { $arrayElemAt: ["$productDetails.Name", 0] } },
        quantitySold: { $sum: "$products.quantity" },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);
  return { result };
};



exports.viewcustomusersalesReport = async (date) => {
  try {
  const fromDate = new Date(date.fromDate);
  const toDate = new Date(date.toDate);


    const result = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          date: {
            $gte: fromDate,
            $lt: new Date(
              toDate.getFullYear(),
              toDate.getMonth(),
              toDate.getDate() + 1
            ),
          },
        },
      },
      {
        $addFields: {
          user: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          referenceNo: 1,
          username: "$userDetails.firstName",
          email: "$userDetails.email",
          price: "$totalAmount",
          paymentMethod: 1,
          status: 1,
          _id: { $toString: "$_id" }, // Convert _id to string
        },
      },
    ]);

    return { result };
  } catch (error) {
    console.log("error:", error);
    return { error };
  }
};



exports.overallTotalcustom = async (date) => {
  try {
  const fromDate = new Date(date.fromDate);
  const toDate = new Date(date.toDate);

    const result = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: fromDate,
            $lt: new Date(
              toDate.getFullYear(),
              toDate.getMonth(),
              toDate.getDate() + 1
            ),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: "$totalAmount",
                else: 0,
              },
            },
          },
          successfulOrders: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "delivered"] },
                then: 1,
                else: 0,
              },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const totalSales = result[0].totalSales;
      const successfulOrders = result[0].successfulOrders;
      const totalOrders = result[0].totalOrders;
      const averageOrderValue =
        successfulOrders > 0 ? totalSales / successfulOrders : 0;

      return {
        totalSales,
        successfulOrders,
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      };
    } else {
      return {
        totalSales: 0,
        successfulOrders: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      };
    }
  } catch (error) {
    console.log("Error:", error);
    return { error };
  }
};