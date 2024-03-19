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



exports.isAdmin = (req, res, next) => {
  let user = req.session.user;
  console.log(user);
  if (req.session.user && req.session.user.role === "admin") {
    next(); 
  } else {
    res.status(403).send("Forbidden"); // User is not an admin, send a forbidden response
  }
};



exports.homePage = async (req, res) => {
  const pageNum = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const perPage = 5;
  try {
    let user = req.session.user;
    let docCount = await adminHelpers.getProduct().countDocuments(); // Count documents in the query
    let products = await adminHelpers
      .getProduct()
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .exec(); // Execute the query

          const totalPages = Math.ceil(docCount / perPage);
          const isFirstPage = pageNum === 1;
          const isLastPage = pageNum === totalPages;
          const currentPage = pageNum;
          const prevPage = isFirstPage ? 1 : pageNum - 1;
          const nextPage = isLastPage ? totalPages : pageNum + 2;
          const next = isLastPage ? totalPages : pageNum + 1;
      
    res.render("admin/view-product", {
      admin: true,
      products: products.map((product, index) => ({
        ...product,
        index: index+(5*(pageNum-1))+1,
      })),
      user,
      prevPage,
      nextPage,
      next,
      totalPages,
      isFirstPage,
      isLastPage,
      currentPage,
      totalDocuments: docCount,
      pages: Math.ceil(docCount / perPage),

    });
  } catch (error) {
    console.error("Error rendering homepage:", error);
    // Handle the error, perhaps redirect to an error page
    res.status(500).send("Internal Server Error");
  }
};



exports.addProductPage = async (req, res) => {
  try {
        let user = req.session.user;
    let categories = await categoryHelpers.getMainCategory();
    console.log("cate:;",categories)
    res.render("admin/add-product", { admin: true,categories, user });
  } catch (error) {
    console.error("Error rendering homepage:", error);
    // Handle the error, perhaps redirect to an error page
    res.status(500).send("Internal Server Error");
  }
};


exports.submitaddProductPage = async (req, res) => {
 try {
  console.log(req.body)
    const result = await adminHelpers.adminAddproduct(req, res);
    if (result.errors) {
      res.status(400).json({ error: result.errors });
    } else {
      console.log("New product:", result.newProduct);
          return res.status(200).json({ message: "new product aded successfully" });

    }
  } catch (error) {
    // Handle other errors
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.deleteProductPage = async (req, res) => {
    try {
      const productId = req.params.id;
      await Products.deleteProductById(productId);

      res.json({ status: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};

exports.editProductPage = async (req, res) => {
   try {
    
     let user = req.session.user;
     const productId = req.params.id;
      let categories = await categoryHelpers.getMainCategory();
     let product = await Products.findOne({ _id: productId }).lean();
     res.render("admin/edit-product", { admin: true, product, user ,categories});
   } catch (error) {
     console.error("Error rendering edit-product page:", error);
     res.status(500).json({ status: false, error: "Internal Server Error" });
   }
};

exports.deleteimgCategorylist=async(req,res)=>{
       const productId = req.params.productId;
       const name=req.params.name;
       console.log("qwertyuoiuytreasdfghj:",productId,name)
     let product = await Products.findOne({ _id: productId })
              console.log("produvyuiol:",product)
              let filteredImages = product.images.filter(
                (image) => image.filename !== name
              );
              let indexToDelete = product.images.findIndex(
                (image) => image.filename === name
              );
                console.log('deletedindex:',indexToDelete)
              if (indexToDelete !== -1) {
                product.images.splice(indexToDelete, 1);
                console.log("deleted success fully")
              }
                            console.log("prdeleted:", product);
              product.markModified("images");
              await product.save();
                    res.json({
                      status: true,
                      message: "Product i deleted successfully",
                    });

}


exports.submiteditProductPage = async (req, res) => {
   try {
     let user = req.session.user;
     const productId = req.params.id;
     const updatedProduct = await adminHelpers.adminEditProduct(
       productId,
       req.body,
       req.files
     );

     if (updatedProduct.error) {
       res.status(400).json({ error: updatedProduct.error });
     } else {
       console.log("Product updated successfully");
       res.redirect("/admin");
     }
   } catch (error) {
     console.error("Error updating product:", error);
     res.status(500).json({ error: "Internal Server Error" });
   }
};


exports.viewUserPage = async (req, res) => {
  try {
    let user = req.session.user;
    const pageNum = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const perPage = 5;
    let docCount = await adminHelpers.getUsers().countDocuments(); // Count documents in the query
    let users = await adminHelpers
      .getUsers()
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .exec(); // Execute the query

    // Calculate pagination data for only four buttons
    const totalPages = Math.ceil(docCount / perPage);
    const isFirstPage = pageNum === 1;
    const isLastPage = pageNum === totalPages;
    const currentPage = pageNum;
    const prevPage = isFirstPage ? 1 : pageNum - 1;
    const nextPage = isLastPage ? totalPages : pageNum + 2;
    const next = isLastPage ? totalPages : pageNum + 1;

    res.render("admin/view-users", {
      admin: true,
      users: users.map((userr, index) => ({
        ...userr,
        index: index + 5 * (pageNum - 1) + 1,
      })),
      user,
      currentPage,
      isFirstPage,
      isLastPage,
      prevPage,
      nextPage,
      totalPages,
      next
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.addUserPage = async (req, res) => {
  try {
     let user = req.session.user;
     adminHelpers.getAllUsers().then((users) => {
       console.log(users);
       res.render("admin/add-user", { admin: true, users, user });
     });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteUserPage = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ _id: userId });
    console.log("del:",user)
    user.access=false;
    await user.save();
    console.log("blo:", user);
    let users = await adminHelpers.getAllUsers();
    res.json({ status: true, message: "User bloked successfully" ,users});
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

exports.unblockUserPage=async(req,res)=>{
  try{
      const userId = req.params.id;
      const user = await User.findOne({ _id: userId });
         user.access = true;
         await user.save();
          let users = await adminHelpers.getAllUsers();
        res.json({ status: true, message: "User unbloked successfully",users });

  }catch(error){
    res.status(500).json({ status: false, error: "Internal Server Error" });

  }
}



exports.editUserPage = async (req, res) => {
  try {
    let user = req.session.user;
    const userId = req.params.id;
    let useredit = await User.findOne({ _id: userId }).lean();
    res.render("admin/edit-user", { admin: true, useredit, user });
  } catch (error) {
    console.error("Error rendering edit-product page:", error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};


exports.submiteditUserPage = async (req, res) => {
  try {
    let user = req.session.user;
    const userId = req.params.id;
    const updatedUser = await adminHelpers.adminEditUser(userId, req.body);

    if (updatedUser.error) {
      res.status(400).json({ error: updatedProduct.error });
    } else {
      console.log("Product updated successfully");
      res.redirect("/admin/view-user");
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.viewOrderPage = async (req, res) => {
  try {
    let user = req.session.user;
    const pageNum = req.query.page;
    const perPage = 5;

    let orderDetails = await adminHelpers.orderDetails(req, res); // Fetch order details
    console.log("orderdetails:",orderDetails);
    let docCount = orderDetails.length; // Count documents in the query
    let orders = orderDetails.slice((pageNum - 1) * perPage, pageNum * perPage); // Paginate the orders
    console.log("order:", orders);

    // Format dates in orders
    orders.forEach((order) => {
      order.formattedDate = order.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });

    res.render("admin/view-orders", {
      admin: true,
      orders,
      user,
      currentPage: parseInt(pageNum),
      totalDocuments: docCount,
      pages: Math.ceil(docCount / perPage),
    });
  } catch (error) {
    console.error("Error rendering view order page:", error);
    // Handle the error, perhaps redirect to an error page
    res.status(500).send("Internal Server Error");
  }
};




exports.cancelOrderPage = async (req, res) => {
  let user = req.session.user;
  let orders = await adminHelpers.cancelDetails(req, res);
  orders.forEach((order) => {
    order.formattedDate = order.date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });
  res.render("admin/view-cancel-orders", { admin: true, user, orders });
};




exports.orderdeleteproduct= async(req,res)=>{
  const orderId = req.params.orderId;
  const productId = req.params.productId;

  isProductEmpty = await orderHelpers.orderItemRemove(orderId, productId);
  if (isProductEmpty) {
    res.json({ status: "success", message: "Product deleted successfully" });
  } else {
    res.json({
      status: "error",
      message: "Error deleting product or product not found",
    });
  }
}

exports.changeOrderStatus=async(req,res)=>{
  const orderId = req.params.id;
  console.log(orderId)
  let updatedStatus =  await adminHelpers.updateOrderStatus(orderId,req.body.status);
    if (updatedStatus) {
      res.json({ status: "success", message: "status updated successfully" });
    } else {
      res.json({
        status: "error",
        message: "Error deleting product or product not found",
      });
    }

}

exports.reloadTable= async (req, res) => {
  try {
     let user = req.session.user;
    const users = await adminHelpers.getAllUsers();
    // Render the HTML for the table body with updated data
    res.render("admin/view-user", { user, users, admin: true });
  } catch (error) {
    console.error("Error fetching updated table data:", error);
    res.status(500).send("Internal Server Error");
  }
};




exports.dashboard = async (req, res) => {
  try {
  let user = req.session.user;
      res.render("admin/view-dashboard", { admin: true, user });
  } catch (error) {
    console.error("Error fetching updated table data:", error);

  }
};
