const db = require("../config/connection");
const collection = "products";
const Products = require("../models/products");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const Users = require("../models/user");
const Order = require("../models/order");



exports.getfilterProducts = async (filters) => {
  try {
    // Destructure filters from the request body
    const { price_range, categories, sizes } = filters;

    // Build the query object based on the provided filters
    let query = {};

    if (price_range) {
      // Split the price range to get the minimum and maximum values
   const [prefix, minPrice, maxPrice] = price_range.split("_");
   query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
    }

    if (categories && categories.length > 0) {
      query.Category = { $in: categories };
    }
    if (sizes && sizes.length > 0) {
      const lowercaseSizes = sizes.map((size) => size.toLowerCase());
      query.sizes = { $in: lowercaseSizes };
    }
     const products = await Products.find(query).lean();
    return products;
  } catch (error) {
    console.error("Error filtering products:", error);
    throw error;
  }
};
