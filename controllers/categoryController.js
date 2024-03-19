var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const Products = require("../models/products");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Category = require("../models/category");


exports.getMainCategory= async(req,res)=>{
    let user = req.session.user;
    try{
      let categories=await categoryHelpers.getMainCategory();
        res.render("admin/main-category", { admin: true, user,categories });
    }catch(error){
        console.error(error)
    }
}


exports.addMainCategory = async (req, res) => {
  let user = req.session.user;
  try {
    res.render("admin/add-main-category", { admin: true, user });
  } catch (error) {
    console.error(error);
  }
};




exports.addMainCategoryform = async (req, res) => {
  let user = req.session.user;
  let categoryName = req.body.categoryName;
const response = await categoryHelpers.postmainCategory(categoryName);
          console.log("sfffffffffff", response);
        if (response.errors) {
          res.json({ response });
        } else {
          res.json({ status: true, response });
        }
};

exports.editmainCategory=async(req,res)=>{
      console.log("categoryyyyyyyyyyyyyyyyyyyyyyyyyy:");
       let user = req.session.user;
       const categoryId = req.params.id;
      let category = await Category.findOne({ _id: categoryId }).lean();
      console.log("categoryyyy:",category)
      res.render("admin/edit-main-category", { admin: true, user,category});

}

exports.editMainCategoryform = async (req, res) => {
  let user = req.session.user;
  let categoryName = req.body.categoryName;
  const categoryId = req.params.id;
  const response = await categoryHelpers.editmainCategory(categoryId,categoryName);
  console.log("sfffffffffff", response);
  if (response.errors) {
    res.json({ response });
  } else {
    res.json({ status: true, response });
  }
};



exports.deleteMainCategory = async (req, res) => {
  let user = req.session.user;
  let id=req.params.id;
    try {
      await Category.findOneAndDelete({ _id: id });

      res.json({ status: true, message: "category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};


exports.getsubCategory = async (req, res) => {
  let user = req.session.user;
  try {
    let response = await categoryHelpers.getsubCategory();
    console.log("sub:", response);
    if(response.errors){
      console.log(response.errors)
    }
    res.render("admin/sub-category", { admin: true, user,response });
  } catch (error) {
    console.error(error);
  }
};


exports.addsubCategory = async (req, res) => {
  let user = req.session.user;
  try {
    let categories = await categoryHelpers.getMainCategory();
    res.render("admin/add-sub-category", { admin: true, user,categories });
  } catch (error) {
    console.error(error);
  }
};


exports.addSubCategoryform= async (req,res)=>{
  console.log(req.body)
  let categoryName = req.body.maincategory;
  let subCategory = req.body.categoryName;
  try{
      const response = await categoryHelpers.addsubCategory(subCategory,categoryName);
      console.log("response:",response)
      if (response.errors) {
        res.json({ response });
      } else {
        res.json({ status: true, response});
      }
  }catch(error){

  }
}


exports.editsubCategory = async (req, res) => {
  let user = req.session.user;
  const categoryId = req.params.id;
  const name=req.params.name;
  const catname = req.params.catname;
  let categories = await categoryHelpers.getMainCategory();
  let category = await Category.findOne({ _id: categoryId }).lean();
  console.log("categoryyyy:", category);
  res.render("admin/edit-sub-category", {admin: true,user,category,categories,name,catname });

};

exports.editsubcategoryform=async(req,res)=>{
  let oldmaincategory=req.params.catname;
  let oldsubcategory = req.params.name;
  let newmaincategory = req.body.maincategory;
  let newsubcategory = req.body.categoryName;
  let response = await categoryHelpers.editSubCategory(oldmaincategory,oldsubcategory,newmaincategory,newsubcategory);
  if (response.errors) {
    res.json({ response });
  } else {
    res.json({ status: true, response });
  }

}

exports.deletesubCategory = async (req, res) => {
  let user = req.session.user;
  let catname = req.params.catname;
  let name=req.params.name;
  try {
    const category = await Category.findOne({ name: catname });
    if (!category) {
      return res
        .status(404)
        .json({ status: false, error: "Category not found" });
    }
    const index = category.subcategories.indexOf(name);
    if (index !== -1) {
      category.subcategories.splice(index, 1);
      await category.save();
      return res.json({
        status: true,
        message: "Subcategory deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ status: false, error: "Subcategory not found" });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};


exports.getsubCategorylist=async (req,res)=>{
  try {
    let categoryName = req.params.name;
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const subcategories = category.subcategories;
    res.status(200).json({ subcategories: subcategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


