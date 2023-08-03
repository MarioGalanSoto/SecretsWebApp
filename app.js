require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate= require("mongoose-findorcreate");

//handle sessions
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//google auth
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//facebook auth
const FacebookStrategy = require('passport-facebook').Strategy;



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
  password:String,
  googleId:String,
  facebookId:String
});

userSchema.plugin(passportLocalMongoose); // add plugin to hash and salt passwords
userSchema.plugin(findOrCreate);//add a plugin to use the function find or create for mongoose

//add the plugin to encrypt fields in database (you can do it to all or specify fields)
// userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  console.log(user);
  done(null, user);
});//save user info in the cookie

passport.deserializeUser(function(user,done){
  //try to find the user
    done(null, user);
  // User.findById(id)
  // .then(function(user){
  //   done(user.id)
  // })
  // .catch((e)=>{
  //   console.log(e);
  // });

  // User.findById(id,function(err,user){
  //   done(err, user.id);
  // });

}); //read and destroy the coockie

//use google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

//use facebook Strategy

passport.use(new FacebookStrategy({
  clientID:process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL:'http://localhost:3000/auth/facebook/secrets'
},

function(accessToken, refreshToken,profile,cb){
  console.log(profile)
  User.findOrCreate({
      facebookId: profile.id,
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
  res.render("home");
});

// app.get("/auth/google", function(req, res){
//   passport.authenticate('google', {scope:["profile"]});
// });


app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route("/auth/google/secrets")
  .get(passport.authenticate('google',{failureRedirect:"/login"}),
  function(req,res){
    //successful authentication
    res.redirect("/secrets");
  }
);

app.route("/auth/google")
  .get(passport.authenticate('google',{scope:["profile"]})
);

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
