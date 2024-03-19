const db = require("../config/connection");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Products = require("../models/products");
const Order = require("../models/order");
const Category = require("../models/category");




exports.postmainCategory=async(categoryName)=>{
    try{   

        const existingCategory = await Category.findOne({name: categoryName});
            if (existingCategory) {
               return { errors: "Category with this name already exists." };
             }
    const newCategory=new Category({
        name:categoryName
    })
    console.log("category",newCategory)
    await newCategory.validate();
    const category = await Category.create(newCategory);
    console.log("category:",category)

    return {category}
    }catch(error){
            console.log("error::::", error);
            let errors = "Category Name should only contain letters";
            console.log("errorsssssss", errors);
             return { errors };
  
    }

}


exports.getMainCategory=async ()=>{
    let category = await Category.find().lean();
        category.forEach((order) => {
      order.created_at = order.created_at.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });
     category.forEach((order) => {
       order.updated_at = order.updated_at.toLocaleDateString("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
       });
     });

    return category
}



exports.editmainCategory= async (categoryId, categoryName)=>{
    try{
    const existingCategory = await Category.findOne({ name: categoryName });
    if (existingCategory) {
        return { errors: "Category with this name already exists." };
    }
    let category = await Category.findOne({ _id: categoryId });
    category.name=categoryName;
           category.updated_at = category.updated_at.toLocaleDateString("en-US", {
             year: "numeric",
             month: "long",
             day: "numeric",
           });
    await category.validate();
    await category.save();
    return category;
    }catch(error){
         console.log("error::::", error);
         let errors = "Category Name should only contain letters";
         console.log("errorsssssss", errors);
         return { errors };
    }
}

exports.getsubCategory=async ()=>{
     try {
    const subCategories = await Category.aggregate([
      { $unwind: "$subcategories" },      
    ]);
    console.log("catttt::::",subCategories)
    return subCategories;
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return { errors: "Internal Server Error" };
  }
}

exports.addsubCategory = async (subCategory, categoryName) => {
    try{

        const subCategoryValidator = /^[a-zA-Z]+$/;
        if (!subCategory.trim()) {
            return { errors: "Subcategory is required" };
            }
        if (!subCategoryValidator.test(subCategory)) {
            return {errors:"Subcategory should only contain letters"};
            }
            const updatedCategory = await Category.findOneAndUpdate({ name: categoryName },
                      { $addToSet: { subcategories: subCategory } }, 
                      { new: true } 
                    );

                    if (!updatedCategory) {
                                  return {errors: "Category not found"};
                    }

                    return { category: updatedCategory };
    }catch(error){
        return{error:"invalid"}
    }
};

exports.editSubCategory = async (
  oldMainCategory,
  oldSubCategory,
  newMainCategory,
  newSubCategory
) => {
  try {
    const subCategoryValidator = /^[a-zA-Z]+$/;
    if (!newSubCategory.trim()) {
      return { errors: "Subcategory is required" };
    }
    if (!subCategoryValidator.test(newSubCategory)) {
      return { errors: "Subcategory should only contain letters" };
    }

    if (oldMainCategory === newMainCategory) {
      const updated = await Category.findOneAndUpdate(
        { name: oldMainCategory, subcategories: oldSubCategory }, // Check if old subcategory exists
        { $pull: { subcategories: oldSubCategory } }, // Remove old subcategory
        { new: true }
      );

      if (!updated) {
        return {
          errors: "Category not found or old subcategory does not exist",
        };
      }

      // Check if new subcategory already exists in the category
      if (updated.subcategories.includes(newSubCategory)) {
        return { errors: "New subcategory already exists in the category" };
      }

      // Add new subcategory to the category
      updated.subcategories.push(newSubCategory);
      await updated.save();

      return { category: updated };
    } else {
      const removedOldCategory = await Category.findOneAndUpdate(
        { name: oldMainCategory, subcategories: oldSubCategory }, // Check if old subcategory exists
        { $pull: { subcategories: oldSubCategory } }, // Remove old subcategory
        { new: true }
      );

      if (!removedOldCategory) {
        return {
          errors: "Old category not found or old subcategory does not exist",
        };
      }

      const addedNewCategory = await Category.findOneAndUpdate(
        { name: newMainCategory },
        { $addToSet: { subcategories: newSubCategory } }, // Add new subcategory
        { new: true }
      );

      if (!addedNewCategory) {
        return { errors: "New category not found" };
      }

      return {
        oldCategory: removedOldCategory,
        newCategory: addedNewCategory,
      };
    }
  } catch (error) {
    console.error("Error editing subcategory:", error);
    return { errors: "Internal Server Error" };
  }
};