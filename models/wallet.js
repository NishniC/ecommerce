const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const nameValidator = /^[a-zA-Z]+$/;


// Define wallet schema
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactionHistory: [
      {
        name: {
          type: String,
        },
        type: {
          type: String, // 'credit' or 'debit'
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Define wallet model
const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
