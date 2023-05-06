
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _=require('lodash');
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// for adding passport for authentication and cookies
app.use(session({
  secret:'secretKey',
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery',false);

mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ejmaaoq.mongodb.net/journalDB`, {useNewUrlParser: true});

const userSchema= new mongoose.Schema({
  googleId: String,
  facebookId: String,
  titleText: [String],
  postText: [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const user=mongoose.model("User",userSchema);

passport.use(user.createStrategy());

// serializing 
passport.serializeUser(function(user,done){
  done(null,user.id);
});

passport.deserializeUser(function(id,done){
  user.findById(id,function(err,user){
    done(err,user);
  })
})


// const journalSchema=new mongoose.Schema({
//     googleID: String,
//     facebookID:String,
//     titleText: String,
//     postText: String
// });

// const Journal=mongoose.model("Journal",journalSchema);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  user.findOrCreate({ googleId: profile.id,username: profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  user.findOrCreate({ facebookId: profile.id,username: profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));


const homeStartingContent = "Welcome to Your Diary, the perfect place to capture your thoughts and memories. With our simple and easy to use designed interface, you can easily compose and organize your entries, giving you the freedom to reflect on your personal journey. Whether you want to document your daily life or special moments, Your Diary is the perfect tool to help you preserve your memories and emotions. With our app, you can look back on your experiences and see how far you've come. Start writing today and begin your journey of self-reflection and growth.";
const aboutContent = "Welcome to Your Diary,this is a digital diary app developed by Adithya N G using Express, Node and MongoDB to implement and imporve my backend skills. The front-end of our app was built using EJS templates.I started it in january of 2023, I recently have improvised it by adding user Authentication and other necessary  functionalities. ";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

app.get("/",function(req,res){
  res.render("home.ejs");
  // Journal.find({},function(err,result)
  // {
  //   if(err)
  //   {
  //     console.log(err);
  //   }
  //   else{
  //     console.log(result);
  //     res.render("home.ejs",{
  //       homestartingcontent: homeStartingContent,
  //       post: result
  //     });
  //   }
  // });
});


// to render the login page

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.get("/register",function(req,res){
  res.render("register.ejs");
});


// for google authentiation
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/diary', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/diary');
  });

  // for authenctication with facebook

app.get('/auth/facebook',
passport.authenticate('facebook'));

app.get('/auth/facebook/diary',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/diary');
});

app.get("/diary",function(req,res){
  user.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else
    {
      res.render("diary.ejs",{
        homestartingcontent:homeStartingContent,
        titleText:foundUser.titleText,
        postText:foundUser.postText
      });
    }
  })
})

app.get("/posts/:title",function(req,res){
  const title=req.params.title;
  console.log(title);
  user.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      let index=foundUser.titleText.indexOf(title);
      res.render('post.ejs',{
        postText: foundUser.postText[index],
        titleText: foundUser.titleText[index]
      });
    }
  });
  // for(var i=0;i<post.length;i++)
  // {
  //   if(_.lowerCase(post[i].titleText)==_.lowerCase(req.params.title))
  //   {
  //     res.render("post.ejs",{
  //     post:post[i]
  //     });
  //   }
  // }
});

app.get("/about",function(req,res){
  res.render("about.ejs",{
    aboutcontent:aboutContent
  });
});
app.get("/contact",function(req,res){
  res.render("contact.ejs",{
    contactcontent:contactContent
  });
});

app.get("/compose",function(req,res){
  res.render("compose.ejs")
});

// to register the user

app.post("/register",function(req,res){
  user.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/diary");
      });
    }
  });
});

app.post("/login",function(req,res){
  const User=new user({
      username: req.body.username,
      password: req.body.password
  });
  req.login(User,function(err){
      if(err){
          console.log(err);
      }
      else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/diary");
          });
      }
  });
});

app.post("/compose",function(req,res)
{
  console.log(req.body);
  const titleText=req.body.titleText;
  const postText=req.body.postText;
  user.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        foundUser.titleText.push(titleText);
        foundUser.postText.push(postText);
        foundUser.save();
        console.log("the saved user is",foundUser);
        res.redirect("/diary");
      }
    }
  })
});

//to logout
app.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
