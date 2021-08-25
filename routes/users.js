const express = require('express');
//const router = express.Router();
const router = express.Router({mergeParams: true});
const Recipe = require('../models/recipe');// This is for the database model
const User = require('../models/user');// This is for the database model
const recipes = require('../controllers/recipes'); 
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, checkProfileOwnership, isAuthor, validateRecipe} = require('../middleware');
const passport = require('passport');
const users = require('../controllers/users');// This is for the controller
const multer  = require('multer');
const {storage} = require('../cloudinary')
const upload = multer({ storage });
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

// edit user
router.get('/users/:id/edit', isLoggedIn, checkProfileOwnership, catchAsync(users.renderUserEditForm));

// update user
router.put('/users/:id', isLoggedIn, checkProfileOwnership, upload.array('image'), catchAsync(users.updateUser)) //Update a User
//forgot password
router.get('/forgot', function(req, res){
  res.render('users/forgot');
});

//forgot password POST
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'recipejarinfo@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'recipejarinfo@gmail.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        //console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});
//reset token GET
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('users/reset', {token: req.params.token});
  });
});

//teset token GET
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'recipejarinfo@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'recipejarinfo@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/recipes');
  });
});
// User profile
router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  console.log(user);
  const recipes = await Recipe.find({}).where('author').equals(user._id);
  res.render("users/show", {user, recipes});
  // for(let rec in recipes){
  //   if (`${recipes[rec].author}` == user._id){
  //     console.log(`${recipes[rec]}`);
  //   }
  // }
});

router.delete('/users/:id', isLoggedIn, checkProfileOwnership, catchAsync(users.deleteUser)); // Delete user

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