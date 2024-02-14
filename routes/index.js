var express = require('express');
var router = express.Router();
var userModel = require("./users");
var postModel = require("./post");
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mailer = require('../mailer');





const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9 ) + path.extname(file.originalname)
    cb(null, uniqueSuffix)
  }
})
const upload = multer({ storage: storage });



const localStrategy =  require("passport-local");
const post = require('./post');
passport.use(new localStrategy(userModel.authenticate()))

router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/upload', isloggedIn, upload.single("image"),function(req, res, next) {
   userModel
   .findOne({username:req.session.passport.user})
   .then(function(founduser){
     if(founduser.image !== "def.png"){
      fs.unlinkSync(`./public/uploads/images/${founduser.image}`);
    }
    founduser.image = req.file.filename;
    founduser.save()
    .then(function(){
      res.redirect("back");
    })
   })
});

router.get("/profile",isloggedIn,function(req,res){
  
  userModel.findOne({username:req.session.passport.user})
  .populate("post")
  .then(function(founduser){
    console.log(founduser)
    res.render("profile",{founduser});
  })

});

router.get('/forgot', function(req, res, next) {
  res.render("forgot")
});

router.post('/forgot', async function(req, res, next) {
    let user =  await userModel.findOne({email:req.body.email})
    if(!user){
      res.send("we have send a mail if user exists");
    }
    else{
      crypto.randomBytes(80, async function(err,buff){
        let key = buff.toString("hex");
        mailer(req.body.email,user._id,key)
        .then(async function(){
          user.expirykey = Date.now()- 24*60*60*1000;
          user.key = key;
          await user.save();
          res.send("mail sent")
        })
      })

    }
});

router.get('/forgot/:userid/:key', async function(req, res, next) {
   let user = await userModel.findOne({_id: req.params.userid})
   if(user.key === req.params.key && Date.now()<user.expiryKey){
     res.render("reset",{user})
   }  else{
    res.send("tez chal rahe ho")
   }
});

 

router.get('/resetpassword', isloggedIn,  function(req,res,next){
  userModel
  .findOne({username:req.session.passport.user})
  .then(function(user){
    console.log(user)
    res.render("resetpassword",{user})
  }) 
})

router.post('/updatepassword/:userid', isloggedIn, async function(req,res,next){
  let user = await userModel.findOne({_id:req.params.userid})
  if(req.body.password[0] === req.body.password[1]){
    await user.setPassword(req.body.password[0], async function(){
      await user.save();
      req.logIn(user, function(){
        res.redirect("/profile")
      })
    })
  }else{
    res.send("both password doesn't match")
  }
})



router.get('/like/:postid',isloggedIn, function(req, res, next) {
  userModel
  .findOne({username:req.session.passport.user})
  .then(function(user){
   postModel
   .findOne({_id:req.params.postid})
   .then(function(post){
    if(post.likes.indexOf(user._id)=== -1){
      post.likes.push(user._id);
    }
    else{
      post.likes.splice(post.likes.indexOf(user._id),1)
    }
    post.save()
    .then(function(){
      res.redirect("back")
    })

   })
  })
});


router.get('/edit', isloggedIn,function(req, res, next) {
   userModel
   .findOne({username:req.session.passport.user})
   .then(function(founduser){
    console.log(founduser)
    res.render("edit",{founduser})
   })
});

router.post('/update',isloggedIn, function(req, res, next) {
   userModel.findOneAndUpdate({username:req.session.passport.user},{username:req.body.username},{new:true})
   .then(function(updateduser){
     req.login(updateduser,function(err){
      if(err){
        return(err);
      }
      return res.redirect("/profile")
     })
   })
});

router.post('/post', isloggedIn,function(req, res, next) {
   userModel
   .findOne({username:req.session.passport.user})
   .then(function(user){
    postModel.create({
      userid:user._id,
      data:req.body.post
    })
    .then(function(post){
      user.post.push(post._id);
      user.save()
      .then(function(){
        res.redirect("back")
      })
    })
   })
});

router.get('/feed',isloggedIn,function (req, res, next) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(user){
    postModel
    .find()
    .populate("userid")
    .then(function(allposts){
      res.render("feed",{allposts,user})
    })
  })
});

router.post('/register', function(req, res, next) {
var newUser = new userModel({
  username: req.body.username,
  email: req.body.email,
  profileimage: req.body.profileimage,
  age: req.body.age
})
userModel.register(newUser,req.body.password)
.then(function(){
  passport.authenticate("local")(req,res,function(){
    res.redirect("/profile")
  })
})
}); 

router.get('/login', function (req, res, next) {
  res.render("login");
});

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login"
}), function (req, res, next) {
});

function isloggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login")
  }
};





module.exports = router;
