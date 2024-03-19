require("dotenv").config();

const bodyParser = require("body-parser");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");
const exphbs = require("express-handlebars");
const hbss = exphbs.create({
  // Set options to allow prototype methods and properties access
  allowProtoMethodsByDefault: true,
  allowProtoPropertiesByDefault: true,
});
const cron = require("node-cron");
const cacheControl = require("cache-control");
var session = require("express-session");
const flash = require("express-flash");
var jwt = require("jsonwebtoken");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const Razorpay = require("razorpay");

// Define a custom Handlebars helper
const Handlebars = require('handlebars');
Handlebars.registerHelper("times", function (n, block) {
  var accum = "";
  for (var i = 1; i < n+1; ++i) accum += block.fn(i);
  return accum;
});
Handlebars.registerHelper("jsonStringify", function (context) {
  return JSON.stringify(context);
});
Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!=":
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case "<":
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case "<=":
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case ">":
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case ">=":
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case "&&":
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case "||":
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});
//routes 

var loginRouter = require("./routes/login");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");

var app = express();

// var fileUpload = require("express-fileupload");
const connectDB = require("./config/connection");
const { log } = require("console");
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialDir: __dirname + "/views/partials/",
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
//layout set
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use(fileUpload());
app.use(
  session({
    secret: "mypage",
    resave: false,
    saveUninitialized: true, 
    cookie: { maxAge: 86400000 }, 
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  res.setHeader("Expires", "-1");
  res.setHeader("Pragma", "no-cache");
  next();
});

// Use an async function to await the connection
connectDB();
//cookies

app.use("*", checkUser);

app.use("/", loginRouter);
app.use("/user", requireAuth, userRouter);
app.use("/admin", requireAuth, adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).render("error", { message: "Not Found", error: {} });
});
// error handler
app.use(function (err, req, res, next) {
  // Log the error
  console.error(err.stack);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
