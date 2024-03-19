var express = require("express");
var router = express.Router();
const userController= require("../controllers/userController")
const loginController = require("../controllers/loginController");


router.get("/", loginController.loginPage);
router.post("/login", loginController.loginPageSubmit);
router.get("/login/signup", loginController.signupPage);
router.post("/signup", loginController.signupPageSubmit);
router.get("/otp-page", loginController.otpPage);
router.post("/verify-otp", loginController.otpPageSubmit);
router.get("/logout", loginController.logout);
router.post("/resend-otp", loginController.resendOTP);

module.exports = router;