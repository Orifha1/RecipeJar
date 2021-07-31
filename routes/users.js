const express = require('express');
//const router = express.Router();
const router = express.Router({mergeParams: true});
const Recipe = require('../models/recipe');// This is for the database model
const User = require('../models/user');// This is for the database model
const recipes = require('../controllers/recipes'); 
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const users = require('../controllers/users');// This is for the controller
const multer  = require('multer');
const {storage} = require('../cloudinary')
const upload = multer({ storage });

//Shortened routes for /register
router.route('/register')
    .get(users.renderRegister) //render register form
    .post(upload.array('image', 1), catchAsync(users.register)); //register a new user
    // .post(upload.single('image'),(req, res) => {
    // //console.log(req.body, req.files);
    // res.send(req.body, req.file)
    // });

//Shortened routes for /login
router.route('/login')
    .get(users.renderLogin) //render login form
    .post(passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), users.Login) //Check login credentials.

//logout user
router.get('/logout', users.Logout);

// User profile
router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id)
  const recipes = await Recipe.find({}).where('author').equals(user._id);
  res.render("users/show", {user, recipes});
  // for(let rec in recipes){
  //   if (`${recipes[rec].author}` == user._id){
  //     console.log(`${recipes[rec]}`);
  //   }
  // }
});

// router.get("/users/:id", function(req, res) {
//     User.findById(req.params.id, function(err, foundUser) {
//       if(err) {
//         req.flash("error", "Something went wrong.");
//         return res.redirect("/");
//       }
//       Recipe.find().where('author').equals(foundUser._id).exec(function(err, recipes) {
//         if(err) {
//           req.flash("error", "Something went wrong.");
//           return res.redirect("/");
//         }
//         res.render("users/show", {user: foundUser, recipes: recipes});
//       })
//     });
//   });


//USER EDIT ROUTE.
// router.get('/users/:id/edit', middleware.checkProfileOwnership, function (req, res) {
//   User.findById(req.params.id, function (err, foundUser) {
//       if(err) {
//           req.flash('error', 'Something Went Wrong!');
//           return res.redirect('/recipes');
//       }
//       res.render('users/edit', {user: foundUser});
//   });
// });

module.exports = router;