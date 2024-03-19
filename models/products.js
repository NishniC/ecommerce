// const mongoose = require("../config/connection");
const mongoose = require("mongoose");
const nameValidator = /^[a-zA-Z]+$/;

const Schema = mongoose.Schema;
const productSchema = new Schema({
  Name: {
    type: String,
    required: [true, "name is required"],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  price: {
    type: Number,
    required: [true, "price is required"],
  },

  Description: {
    type: String,
    required: [true, "description is required"],
  },
  brand: {
    type: String,
  },
  sizes: [
    {
      type: String,
    },
  ],
  subcategories: [String],
  quantity: {
    type: Number,
    required: [true, "First name is required"],
    min: 1,
    max: 50,
  },
  Category: [String],
  discount: {
    type: Number,
    default: 0,
  },
  images: [
    {
      filename: {
        type: String,
        unique: true,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
      imageBase64: {
        type: String,
        required: true,
      },
    },
  ],
});

productSchema.statics.deleteProductById = async function (productId) {
  return this.deleteOne({ _id: productId });
};

module.exports = mongoose.model("products", productSchema);
