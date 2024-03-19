const db = require("../config/connection");
const collection = "products";
const Products = require("../models/products");
const mongoose = require("mongoose");
const multer = require("multer");
const fs=require('fs');
const Users = require("../models/user");
const Order = require("../models/order");


async function checkForDuplicateFilename(files) {
  for (const file of files) {
    const existingProduct = await Products.findOne({
      "images.filename": file.originalname,
    });
    if (existingProduct) {
      return file.originalname; // Return the duplicate filename
    }
  }
  return null; // No duplicate filename found
}


exports.adminAddproduct = async (req, res) => {
  try {
    const files = req.files;
    if (!files) {
      const error = new Error("Please choose files");
      error.httpStatusCode = 400;
      throw error;
    }

    const duplicateFilename = await checkForDuplicateFilename(files);
    if (duplicateFilename) {
      // Handle the duplicate filename (e.g., show an error message)
      return { error: "Duplicate filename found" };
    }

    let imgArray = files.map((file) => {
      let img = fs.readFileSync(file.path);
      let encode_image = img.toString("base64");
      return {
        filename: file.originalname,
        contentType: file.mimetype,
        imageBase64: encode_image,
      };
    });

    const newProduct = new Products({
      Name: req.body.Name,
      Category: req.body.Category,
      price: req.body.price,
      Description: req.body.Description,
      sizes: req.body.sizes, 
      quantity: req.body.quantity,
      images: imgArray,
    });

    await newProduct.save();
    console.log("New product:", newProduct);

    return { newProduct };
  } catch (error) {
    console.error("Error handling request:", error);
    return { error: error.message || "Internal Server Error" };
  }
};



exports.getAllProducts = () => {
  return new Promise(async (resolve, reject) => {
    let products = await Products.find().lean();
    resolve(products);
  });
};

exports.getAllUsers = () => {
  return new Promise(async (resolve, reject) => {
    let users = await Users.find().lean();
    resolve(users);
  });
};

exports.getProductsByCategory = async (category) => {
  const products = await Products.find({ Category: category }).lean();
  return products;
};

exports.adminEditProduct = async (productId, updatedProductDetails, files) => {
  try {
    console.log(files);
    // Find the existing product by ID
    const existingProduct = await Products.findById(productId);

    if (!existingProduct) {
      return { error: "Product not found" };
    }

    // Update product details
    existingProduct.Name = updatedProductDetails.Name || existingProduct.Name;
    existingProduct.Category = updatedProductDetails.Category || existingProduct.Category;
    existingProduct.price = updatedProductDetails.price || existingProduct.price;
    existingProduct.Description = updatedProductDetails.Description || existingProduct.Description;

    // Update images if new ones are provided
    if (files && files.length > 0) {
      existingProduct.images = files.map((file) => {
        return {
          filename: file.originalname,
          contentType: file.mimetype,
          imageBase64: file.buffer.toString("base64"),
        };
      });
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    return { updatedProduct };
  } catch (error) {
    console.error("Error editing product:", error);
    return { error: "Error editing product" };
  }
};


exports.orderDetails=async (req, res)=>{
  try{
const result = await Order.aggregate([
  {
    $unwind: "$products",
  },
  {
    $addFields: {
      // Convert the 'item' field to ObjectId
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
  
  
]);
console.log("result",result)
    result.forEach((order) => {
      console.log("Order Product Details:", order.productDetails);
    });
  return result;
  }catch(error){
  console.log(error)
}
}


exports.updateOrderStatus= async(orderId, orderStatus)=>{
  console.log(orderId)
  console.log(orderStatus)
  try{
      await Order.updateOne(
        { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
        { $set: { status: orderStatus } }
      );
      return { success}
  }catch(error){
    return{error}
  }
  
}