var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const Products = require("../models/products");
const multer = require("multer");
const store = require("../middleware/multer");
const User = require("../models/user");
const UserHelpers = require("../helpers/user-helpers");
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const salesController = require("../controllers/salesController");
const offerController=require("../controllers/offercController");
const dashboardController = require("../controllers/dashboardController");



//dashboard
router.get("/", adminController.isAdmin, dashboardController.dashboard);
router.get("/salesreport/:name",adminController.isAdmin,dashboardController.salesreport);
router.get("/revenuereport/:name",adminController.isAdmin,dashboardController.revenuereport);
router.get("/customerreport/:name",adminController.isAdmin,dashboardController.customerreport);
router.get("/report/:name",adminController.isAdmin,dashboardController.report);
router.get( "/topProductFilter/:name",adminController.isAdmin,dashboardController.topProductFilter);
router.get("/topBrandFilter/:name",adminController.isAdmin,dashboardController.topBrandFilter);
router.get("/topCategoryFilter/:name",adminController.isAdmin,dashboardController.topCategoryFilter);




router.get("/view-product", adminController.isAdmin, adminController.homePage);
router.get("/add-product",adminController.isAdmin,adminController.addProductPage);
router.post("/add-product",store.array("images", 4),adminController.submitaddProductPage);
router.get("/delete-product/:id",adminController.deleteProductPage);
router.get("/edit-product/:id", adminController.editProductPage);
router.post("/edit-product/:id", adminController.submiteditProductPage);
router.get("/view-user", adminController.viewUserPage);
router.get("/reload-table", adminController.reloadTable);
router.get("/add-user", adminController.addUserPage);
router.get("/delete-user/:id", adminController.deleteUserPage);
router.get("/unblock-user/:id", adminController.unblockUserPage);
router.get("/edit-user/:id", adminController.editUserPage);
router.post("/edit-user/:id", adminController.submiteditUserPage);
router.get("/view-order", adminController.viewOrderPage);
router.get("/cancel-order", adminController.cancelOrderPage);
router.get("/delete-ordered-product/:orderId/:productId",adminController.orderdeleteproduct);
router.post("/update-order-status/:id",adminController.changeOrderStatus);
router.get("/view-mainCategory",categoryController.getMainCategory);
router.get("/add-main-category", categoryController.addMainCategory);
router.post("/addMainCategory", categoryController.addMainCategoryform);
router.get("/admin/edit-mainCategory/:id",categoryController.editmainCategory);
router.post("/editMainCategory/:id", categoryController.editMainCategoryform);
router.get("/delete-category/:id", categoryController.deleteMainCategory);
router.get("/view-subCategory", categoryController.getsubCategory);
router.get("/add-sub-category", categoryController.addsubCategory);
router.post("/addSubCategory", categoryController.addSubCategoryform);
router.get("/admin/edit-subCategory/:id/:name/:catname", categoryController.editsubCategory);
router.post("/editSubCategory/:catname/:name", categoryController.editsubcategoryform);
router.get("/delete-subcategory/:catname/:name",categoryController.deletesubCategory);
router.get("/get-subcategories/:name",categoryController.getsubCategorylist);
router.get("/delete-image/:productId/:name", adminController.deleteimgCategorylist);

//sales report

router.get("/view-dailysalesreport", salesController.viewdailySalesReport);
router.get("/view-weeksalesreport", salesController.viewweekelySalesReport);
router.get("/view-yearsalesreport", salesController.viewyearSalesReport);
router.get("/view-customizesalesreport", salesController.customizeSalesReport);
router.post("/generate-sales-report", salesController.generateSalesReport);


//offer module
router.get("/view-offerModule", offerController.viewofferModule);
router.get("/add-categorryOffer", offerController.addcategorryofferModule);
router.post("/add-categoryoffer", offerController.addcategorryoffer);
router.get("/unlistoffer/:id", offerController.unlistoffer);
router.get("/edit-categoryoffer/:id", offerController.editcategoryoffer);
router.post("/edit-categoryoffer/:id", offerController.editcategorryoffer);
router.get("/view-productOffer", offerController.viewproductoffer);
router.get("/add-productOffer", offerController.addproductoffer);
router.post("/add-productcategoryoffer", offerController.addproductcategorryoffer);
router.get("/unlistproductoffer/:id", offerController.unlistproductoffer);
router.get("/edit-productcategoryoffer/:id", offerController.editproductcategoryoffer);
router.post("/edit-productoffer/:id",offerController.editproductoffer);
router.get("/view-referaloffer", offerController.viewrefferaloffer);
router.get("/add-RefferalOffer", offerController.addReferaloffer);
router.post("/add-referaloffer", offerController.addreferaloffer);
router.get("/edit-referenceoffer/:id", offerController.editreferenceoffer);
router.post("/edit-referaloffer/:id", offerController.editreferaloffer);


//coupon module
router.get("/view-couponModule", offerController.viewcouponModule);
router.get("/add-Coupon", offerController.addCoupon);
router.post("/add-couponform", offerController.addCouponForm);
router.get("/unlistcoupon/:id", offerController.unlistcoupon);
router.get("/edit-coupon/:id", offerController.editcouponform);
router.post("/edit-couponform/:id", offerController.editcoupon);


module.exports = router;
