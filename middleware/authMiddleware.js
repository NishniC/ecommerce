const jwt = require("jsonwebtoken");
const User = require("../models/user");

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "thisismysecret", (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/");
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect("/");
  }
};

const checkUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
   try {
      const decodedToken = await jwt.verify(token, "thisismysecret");
      console.log(decodedToken);

      let user = await User.findById(decodedToken.id);
      res.locals.user = user;
      next();
    } catch (error) {
      res.locals.user = null;
      next(); // Continue to the next middleware or route handler
    }
  } else {
    res.locals.user = null;
    next(); // Continue to the next middleware or route handler
  }
};

module.exports = { requireAuth, checkUser };
