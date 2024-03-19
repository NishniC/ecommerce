var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const orderHelpers = require("../helpers/order-helpers");
const Products = require("../models/products");
const multer = require("multer");
const store = require("../middleware/multer");
const User = require("../models/user");
const UserHelpers = require("../helpers/user-helpers");
const user = require("../models/user");
const categoryHelpers = require("../helpers/category-helpers");
const dashboardHelpers = require("../helpers/dashboard-helpers");

//*********************starting dashboard*************************/
exports.dashboard = async (req, res) => {
  try {
    let user = req.session.user;
    const sales = await dashboardHelpers.numberSales();
    const revenue=await dashboardHelpers.revenuedaily();
    const numberUsers = await dashboardHelpers.numberUsers();
    const weekrevenue = await dashboardHelpers.weekrevenue();
    const weeksales = await dashboardHelpers.weeksales();
    const weekcustomers = await dashboardHelpers.weekcustomers();
    const topProducts = await dashboardHelpers.topProductsWeek();
    const topBrands = await dashboardHelpers.topBrands();
    const topCategory = await dashboardHelpers.topCategories();
    console.log("number:",topBrands);
    
    res.render("admin/view-dashboard", {
      admin: true,
      user,
      sales,
      revenue,
      numberUsers,
      weekrevenue,
      weeksales,
      weekcustomers,
      topProducts,
      topBrands,
      topCategory,
    });
  } catch (error) {
    console.error("Error fetching updated table data:", error);
  }
};

//********************* ending dashboard*************************/


//*********************starting sales report*************************/

exports.salesreport=async(req,res)=>{
    try{
    let time = req.params.name;
    if(time==="This Month"){
        const sales = await dashboardHelpers.monthlynumberSales();
       res.json({ success: true, data: sales });

    }else if(time==="This Year"){
        const sales = await dashboardHelpers.yearlynumberSales();
        res.json({ success: true, data: sales });

    }else{
        const sales = await dashboardHelpers.numberSales();
           res.json({ success: true, data: sales });
    }

}catch(error){
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
}

}
//*********************ending revenue report*************************/

//*********************starting revenue report*************************/

exports.revenuereport = async (req, res) => {
  try {
    let time = req.params.name;
    if (time === "This Month") {
        const revenue = await dashboardHelpers.revenueMonthly();
          res.json({ success: true, data: revenue });

    } else if (time === "This Year") {
        const revenue = await dashboardHelpers.revenueYearly(); 
          res.json({ success: true, data: revenue });

  
    } else {
        
      const revenue = await dashboardHelpers.revenuedaily();
      res.json({ success: true, data: revenue });
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



//*********************ending revenue report*************************/


//*********************starting user report*************************/

exports.customerreport=async(req,res)=>{
      try {
        let time = req.params.name;
        if (time === "This Month") {
          const numberUsers = await dashboardHelpers.monthlyUsers();
          res.json({ success: true, data: numberUsers });
        } else if (time === "This Year") {
          const numberUsers = await dashboardHelpers.yearlyUsers();
          res.json({ success: true, data: numberUsers });
        } else {
          const numberUsers = await dashboardHelpers.numberUsers();
          res.json({ success: true, data: numberUsers });
        }
      } catch (error) {
        console.error("Error fetching sales data:", error);
        res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      }

}




//*********************ending user report*************************/


//*********************starting report Chart*************************/

exports.report=async(req,res)=>{

  try {
    let time = req.params.name;
    if (time === "Monthly") {
      console.log("month");
      const revenue = await dashboardHelpers.monthlyRevenue();
      const sales = await dashboardHelpers.monthlysales();
      const customers = await dashboardHelpers.monthlycustomers();
      res.json({ success: true, data: { sales, revenue, customers } });
    } else if (time === "Yearly") {
      const revenue = await dashboardHelpers.yearRevenue();
      const sales = await dashboardHelpers.yearsales();
      const customers = await dashboardHelpers.yearcustomers();
      res.json({ success: true, data: { sales, revenue, customers } });
    } else {
      console.log("week");
      const revenue = await dashboardHelpers.weekrevenue();
      const sales = await dashboardHelpers.weeksales();
      const customers = await dashboardHelpers.weekcustomers();
      res.json({ success: true, data: { sales, revenue, customers } });
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }

}


//*********************top product repoort*************************/

exports.topProductFilter=async(req,res)=>{
  try {
    let time = req.params.name;
    if (time === "This Month") {
      const topProducts = await dashboardHelpers.topProductsMonth();
      res.json({ success: true, data: topProducts });
    } else if (time === "This Year") {
       const topProducts = await dashboardHelpers.topProductsYear();
       res.json({ success: true, data: topProducts });

    } else {
        const topProducts = await dashboardHelpers.topProductsWeek();
        res.json({ success: true, data:topProducts});

    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}



//********************* end product repoort*************************/


//*********************top brand repoort*************************/
exports.topBrandFilter = async (req, res) => {
  try {
    let time = req.params.name;
    if (time === "This Month") {
    const topBrands = await dashboardHelpers.topBrandsMonth();
      res.json({ success: true, data: topBrands });
    } else if (time === "This Year") {
      const topBrands = await dashboardHelpers.topBrandsYearly();
      res.json({ success: true, data: topBrands });
    } else {
      const topBrands = await dashboardHelpers.topBrands();
      res.json({ success: true, data: topBrands });
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


//********************* end top brand repoort*************************/



//*********************top cataegoryrepoort*************************/

exports.topCategoryFilter = async (req, res) => {
  try {
    let time = req.params.name;
    if (time === "This Month") {
      console.log("month")
          const topCategory = await dashboardHelpers.topCategoriesMonthly();
                console.log("month:",topCategory);

          res.json({ success: true, data: topCategory });
    } else if (time === "This Year") {
            console.log("year");
          const topCategory = await dashboardHelpers.topCategoriesYearly();
                          console.log("year:", topCategory);

          res.json({ success: true, data: topCategory });
    } else {
    const topCategory = await dashboardHelpers.topCategories();
      res.json({ success: true, data: topCategory});
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


//********************* end top category repoort*************************/