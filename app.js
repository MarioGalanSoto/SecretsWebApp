require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");

const app= express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});

const userSchema= new mongoose.Schema({
  email:String,
  password:String
});


//add the plugin to encrypt fields in database (you can do it to all or specify fields)
userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:['password'] });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.post("/register", function(req, res){
  const newUser = new User({
    email:req.body.username,
    password: req.body.password
  });

  try{
    newUser.save();
    res.render("secrets");
  }catch(err){
    console.log(err);
  };

});

app.post("/login", function(req,res){
  const username = req.body.username;
  const password = req.body.password;


  //check if the user exists on the database
  User.findOne({email:username}).then(function(foundUser){
    try{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
        else{
          console.log("user not found");
        }
      }
    }catch(err){
      console.log(err);
    };
  });

});

app.listen(3000, function(){
  console.log("server running on port 3000...");
})
