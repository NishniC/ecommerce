var express = require("express");
var router = express.Router();
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const profileController = require("../controllers/profileController");
const wishlistController=require("../controllers/wishlistController")
const productController = require("../controllers/productController");
const { requireAuth, checkUser } = require("../middleware/authMiddleware");

router.get("/", requireAuth, userController.homePage);
router.get("/productDetails/:id",requireAuth,userController.productDetailsPage);
router.get("/category/:name", requireAuth, userController.categoryPage);
router.get("/referral-link", requireAuth, userController.getUserRefferal);



//cart items
router.get("/cartDetails", requireAuth, cartController.cartDetailsPage);
router.get("/cart-details-empty", requireAuth, cartController.cartdetailsempty);
router.get("/add-to-cart/:id", requireAuth, cartController.addtocart);
router.post("/change-product-quantity",requireAuth,cartController.changeProQuantity);
router.post("/remove-cart-item", requireAuth, cartController.cartItemRemove);


//order
router.get("/place-order", requireAuth, orderController.placeOrder);
router.get("/place-address-order",requireAuth,orderController.placeOrderaddress);
router.post("/place-order-address",requireAuth,orderController.placeOrdersave);
router.post("/place-order", requireAuth, orderController.placeOrderform);
router.get("/ordersuccess", requireAuth, orderController.orderSuccessPage);
router.get("/orderfailed/:id", requireAuth, orderController.orderfailedPage);
router.get("/ordersuccessid", requireAuth, orderController.orderSuccessPageid);
router.get("/myOrderPage/:id", requireAuth, orderController.myOrderPage);
router.get("/view-order-products/:id",requireAuth,orderController.vieworderProduct);
router.get("/view-pending-products/:id",requireAuth,orderController.viewpendingProduct);
router.post("/remove-order-item", requireAuth, orderController.removeOrderItem);
router.get("/order-empty", requireAuth, orderController.orderempty);
router.post("/verify-payment", requireAuth, orderController.verifyPayment);
router.get("/view-delivered-products/:id",requireAuth,orderController.deliveredOrderPage);
router.post("/replace-order-item",requireAuth,orderController.replaceOrderItem);
router.get("/replaced-order/:id", requireAuth, orderController.replaceProduct);
router.post("/return-order-item", requireAuth, orderController.returnOrderItem);
router.get("/return-order/:orderid/:walletid",requireAuth,orderController.returnProduct);
router.post("/validate-coupon", requireAuth, orderController.validateCoupon);
router.post("/remove-coupon", requireAuth, orderController.removeCoupon);
router.get("/invoice/:id", requireAuth, orderController.viewinvoice);
router.get("/continue-payment/:id",requireAuth,orderController.continuePayment);



//profile
router.get("/user-profile", requireAuth, profileController.userProfilePage);
router.get("/edit-profile", requireAuth, profileController.userEditPage);
router.post("/edit-userName/:id", requireAuth, profileController.editUserName);
router.post("/edit-email/:id", requireAuth, profileController.editUserEmail);
router.get("/updatedotp-page", requireAuth, profileController.updatedotpPage);
router.post("/verify-newotp", requireAuth, profileController.verifynewotp);
router.get("/forlogout", requireAuth, profileController.forlogout);
router.post("/edit-password/:id", requireAuth, profileController.editpassword);
router.get("/myAddress/:id", requireAuth, profileController.myaddress);
router.get("/edit-address/:id", requireAuth, profileController.editaddress);
router.post("/edit-address/:id",requireAuth,profileController.editaddresspost);
router.get("/delete-address/:id", requireAuth, profileController.deleteaddress);
router.get("/add-address", requireAuth, profileController.addaddress);
router.post("/add-address", requireAuth, profileController.addaddressform);

//wishlist
router.get("/wishlist", requireAuth, wishlistController.viewWishlist);
router.get("/add-to-wishlist/:id",requireAuth,wishlistController.addtowishlist);
router.get("/remove-wishlistItem/:wid/:pid",requireAuth,wishlistController.wishlistItemRemove);
router.get("/wishlist-empty", requireAuth, wishlistController.getwishlistempty);
router.get("/add-to-cart-wish/:wid/:pid",requireAuth,wishlistController.addtocartwish);

//searchproduct
router.get("/search", requireAuth, userController.searchProduct);
router.get("/searchbutton", requireAuth, userController.searchbuttonProduct);


//wallet
router.get("/wallet", requireAuth, userController.walletPage);



//products filter
router.get("/productsfilter", requireAuth, productController.productPage);
router.post("/productfilter", requireAuth, productController.profilter);
router.get("/product-pagination",requireAuth,productController.productpagination);


module.exports = router;
