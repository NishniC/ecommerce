const db = require("../config/connection");
const collection = "products";
const Products = require("../models/products");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const Users = require("../models/user");
const Order = require("../models/order");
const Category = require("../models/category");


const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = {
    Name: "",
    price: "",
    Description: "",
    quantity: "",
  };

  // Check if the error is a Mongoose validation error
  if (err.message.includes("validation failed")) {
    // Iterate through the errors and assign them to the corresponding keys in the errors object
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }

  return errors;
};



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
 

exports.getProductsByCategory = async (category) => {
  const products = await Products.find({ Category: category }).lean();
  return products;
};




exports.getAllProducts = () => {
  return new Promise(async (resolve, reject) => {
    let products = await Products.find().lean();
    resolve(products);
  });
};

exports.getProduct = () => {
  return Products.find().lean(); // Return the Mongoose query directly
};


exports.getUsers = () => {
  return Users.find().lean(); // Return the Mongoose query directly
};



exports.adminAddproduct = async (req, res) => {
  try {
    const files = req.files;
    if (!files) {
      const error = new Error("Please choose files");
      error.httpStatusCode = 400;
      throw error;
    }

     for (const file of files) {
      if (!file.mimetype.startsWith("image/")) {
        const errors = { image: "Only images are allowed" };
        return { errors };
      }}

    const duplicateFilename = await checkForDuplicateFilename(files);
    if (duplicateFilename) {
        const errors = { image: "Duplicate filename found" };
        return {errors};
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
    const categoryId= await Category.findOne({ name: req.body.category });
    const newProduct = new Products({
      Name: req.body.Name,
      Category: req.body.Category,
      subcategories: req.body.subcategory,
      price: req.body.price,
      brand: req.body.brand,
      Description: req.body.Description,
      sizes: ["xs", "s", "m", "l", "xl", "xxl"],
      quantity: req.body.quantity,
      images: imgArray,
      category: categoryId._id,
    });
    await newProduct.validate();
    await newProduct.save();
    console.log("New product:", newProduct);

    return { newProduct };
  } catch (error) {
    const errors = handleErrors(error);
    console.log("erors::::",errors)
    return { errors};
  }
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
    existingProduct.Category =
      updatedProductDetails.Category || existingProduct.Category;
    existingProduct.price =
      updatedProductDetails.price || existingProduct.price;
    existingProduct.Description =
      updatedProductDetails.Description || existingProduct.Description;

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

exports.getAllUsers = () => {
  return new Promise(async (resolve, reject) => {
    let users = await Users.find().lean();
    resolve(users);
  });
};

exports.adminEditUser = async (userId, updatedUserDetails) => {
  try {
    const existingUser = await Users.findById(userId);

    if (!existingUser) {
      return { error: "user not found" };
    }

    // Update product details
    existingUser.firstName =
      updatedUserDetails.firstName || existingUser.Name;
    existingUser.lastName =
      updatedUserDetails.lastName || existingUser.lastName;
    existingUser.email = updatedUserDetails.email || existingUser.email;
    existingUser.password =
      updatedUserDetails.password || existingUser.password;
    // Save the updated product
    const updatedUser = await existingUser.save();

    return { updatedUser };
  } catch (error) {
    console.error("Error editing product:", error);
    return { error: "Error editing product" };
  }
};


exports.orderDetails = async (req, res) => {
  try {
    const result = await Order.aggregate([
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
    ]);

    console.log("result", result);
    result.forEach((order) => {
      console.log("Order Product Details:", order.productDetails);
    });

    // Returning the result directly without additional processing
    return result;
  } catch (error) {
    console.log(error);
    throw error; // Rethrow the error to handle it in the caller function
  }
};



exports.cancelDetails = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          "reason": { $exists: true, $ne: null }, 
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
    ]);
    console.log("result", result);
    result.forEach((order) => {
      console.log("Order Product Details:", order.productDetails);
    });
    return result;
  } catch (error) {
    console.log(error);
  }
};



exports.updateOrderStatus = async (orderId, orderStatus) => {
  console.log(orderId);
  console.log(orderStatus);
  try {
    await Order.updateOne(
      { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
      { $set: { status: orderStatus } }
    );
     if (orderStatus === "delivered") {
       await Order.updateOne(
         { _id: mongoose.Types.ObjectId.createFromHexString(orderId) },
         { $set: { delivereddate: new Date() } }
       );
     }
    return { success:true };
  } catch (error) {
    return { error };
  }
};