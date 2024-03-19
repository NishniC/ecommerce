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
const salesHelpers = require("../helpers/sales-helpers");

//view daily sales report
exports.viewdailySalesReport=async(req,res)=>{
    try{
    let user = req.session.user;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayDateString = `${day}/${month}/${year}`;
    let salesReport= await salesHelpers.viewdailySalesReport();
    let productsales=await salesHelpers.viewproductsalesReport();
    let userwisesales = await salesHelpers.viewusersalesReport();   
    let summary = await salesHelpers.overallTotalToday(); 


    res.render("admin/daily-sales", {
      admin: true,
      user,
      salesReport,
      productsales,
      userwisesales,
      summary,
      todayDateString,
    });
    }catch(error){

    }
}


//view weekly sales report

exports.viewweekelySalesReport = async (req, res) => {
  try {
    let user = req.session.user;
     console.log(" weekly sales salesreport:");
    const today = new Date();
    const yearto = today.getFullYear();
    const monthto = String(today.getMonth() + 1).padStart(2, "0");
    const dayto = String(today.getDate()).padStart(2, "0");
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const year = firstDayOfWeek.getFullYear();
    const month = String(firstDayOfWeek.getMonth() + 1).padStart(2, "0");
    const day = String(firstDayOfWeek.getDate()).padStart(2, "0");
    const startOfWeekDateString = `${day}/${month}/${year}`;
    console.log("start:",startOfWeekDateString)
    const todayDateString = `${dayto}/${monthto}/${yearto}`;

    let salesReport = await salesHelpers.viewWeeklySalesReport();
    let productsales = await salesHelpers.viewWeeklyproductsalesReport();
    let userwisesales = await salesHelpers.viewweeklyusersalesReport();
    console.log("salesreport:", salesReport);
    console.log("productsales:", productsales);
    console.log("userwiseales:", userwisesales);  
     

    let summary = await salesHelpers.overallTotalweek();
     console.log("summary:", summary);
    res.render("admin/weekly-sales", {
      admin: true,
      user,
      salesReport,
      productsales,
      userwisesales,
      summary,
      todayDateString,
      startOfWeekDateString,
    });
  } catch (error) {}
};



exports.viewyearSalesReport = async (req, res) => {
  try {
    let user = req.session.user;
    const today = new Date();
    const year = today.getFullYear();

    let salesReport = await salesHelpers.viewYearlySalesReport();
    let productsales = await salesHelpers.viewyearlyproductsalesReport();
    let userwisesales = await salesHelpers.viewyearlyusersalesReport();
    let summary = await salesHelpers.overallTotalyear();
    console.log("salesreport:", salesReport);
    console.log("productsales:", productsales);
    console.log("userwiseales:", userwisesales);  
    console.log("summary:", summary);  

    res.render("admin/yearly-sales", {
      admin: true,
      user,
      salesReport,
      productsales,
      userwisesales,
      summary,
      year
    });
  } catch (error) {}
};




exports.customizeSalesReport=async(req,res)=>{

    let user = req.session.user;
    res.render("admin/customise-sales", { user, admin: true });
}


exports.generateSalesReport = async (req, res) => {
    let user = req.session.user;
    console.log("my body id:",req.body);
    let salesReport = await salesHelpers.viewcustomersSalesReport(req.body);
    console.log("sales:",salesReport)
    let productsales = await salesHelpers.viewcustomproductsalesReport(req.body);
    let userwisesales = await salesHelpers.viewcustomusersalesReport(req.body);
    let summary = await salesHelpers.overallTotalcustom(req.body);
 res.status(200).json({ salesReport,productsales,userwisesales,summary });
};