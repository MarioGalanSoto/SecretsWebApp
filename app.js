require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//handle sessions
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app= express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));

//tell the app to use sessions from the session package installed
app.use(session({
  secret: "Our little secret is save.",
  resave: false,
  saveUninitialized: false
}));

//tell app to initialize passport
app.use(passport.initialize());
//tell app to use sessions with passport
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});


//Schema has to be mongoose schema for sessions and security measures
const userSchema= new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose); // add plugin to hash and salt passwords

//add the plugin to encrypt fields in database (you can do it to all or specify fields)
// userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());  //save in the cookie
passport.deserializeUser(User.deserializeUser()); // read and destroy the coockie


app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err,  user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }

  });


});

app.post("/login", function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

 req.login(user, function(err){
   if(err){
     console.log(err);
   }else{
     passport.authenticate("local")(req, res, function(){
       res.redirect("/secrets");
     });
   }
 });




});

app.get("/logout", function(req, res, next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    else{
      res.redirect("/");
    }
  });
});

app.listen(3000, function(){
  console.log("server running on port 3000...");
})
