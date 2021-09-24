
const User = require('../models/user');
const { cloudinary } = require("../cloudinary");
const recipes = require('../controllers/recipes'); 
const Recipe = require('../models/recipe');// This is for the database model
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const passport = require('passport');


module.exports.renderRegister = (req,res) =>{
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {

    try{
        const {email, username, password, image} = req.body;
        let checker = req.body.password;
        //pattern for password
        let strongPassword = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})')
        //check if password matches pattern
        if(!strongPassword.test(checker)){
          req.flash('error', 'Password must be 8 characters including 1 uppercase letter, 1 lowercase letter and numeric characters');
          return res.redirect('back');
        } 
        const user = new User({email, username, image});
        const registeredUser = await User.register(user, password);
        user.image =  req.files.map(f => ({ url:f.path, filename:f.filename }));
        async.waterfall([
            function(done) {
              crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
              });
            },
            function(token, done) {
              User.findOne({ email: req.body.email }, function(err, user) {
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
                subject: 'Email confirmation',
                text: 'You are receiving this because you (or someone else) has registered for RecipeJar.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/login/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and you will not be registered to RecipeJar.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                //console.log('mail sent');
                req.flash('success', 'Please confirm your email. An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
              });
            }
          ], function(err) {
            if (err) return next(err);
            res.redirect('/recipes');
          });
        // req.login(registeredUser, err => {
        //     if(err){
        //         return next(err);
        //     }
        //     req.flash('success','Welcome to RecipeJar');
        //     res.redirect('/recipes');
        // });
    }catch(e){
        req.flash('error', 'Account with the username or email already exists. Please try changing your username.');
        res.redirect('/register');
    }
}
module.exports.showRecipe = async (req, res) =>{
    //find recipe using url paremeter id
    const recipe = await Recipe.findById(req.params.id).populate({
        path: 'reviews',
        populate: {//populate author of the reviewer.
            path: 'author'
        }
    }).populate('author');//populate author the recipe shown.
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', {recipe});
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.renderUserEditForm = async (req, res) =>{
    const { id } = req.params;
    const user = await User.findById(id);
    if(!user){
        req.flash('error', 'Can not find that User');
        return res.redirect('/recipes');
    }
    res.render('users/edit', {user});
}
module.exports.showProfile = async (req, res) => {
  try{
    const user = await User.findById(req.params.id).populate('followers').exec();
    if(!user){
      req.flash('error', 'Can not find that User');
      return res.redirect('/recipes');
    }
    const recipes = await Recipe.find({}).where('author').equals(user._id);
    return res.render("users/show", {user, recipes});
  }catch{
    req.flash('error', 'Can not find that User');
    return res.redirect('/recipes');
  }
    
    // for(let rec in recipes){
    //   if (`${recipes[rec].author}` == user._id){
    //     console.log(`${recipes[rec]}`);
    //   }
    // }
  };

module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body.user);
        if (!user) {
            req.flash('error', 'Can not find that User');
            res.redirect('/recipes');
        }
        await user.save();
        req.flash('success', 'Your profile has been updated');
        return res.redirect(`/users/${user._id}`);
  
}
module.exports.deleteUser = async (req, res) =>{
    const { id } = req.params;

    await User.findByIdAndDelete(id);
    const user = await User.findById(id);
    // await Recipe.findByIdAndDelete(user.recipes);
    // if(!user){
    //     req.flash('error', 'Can not find that User');
    //     return res.redirect('/recipes');
    // }
    req.flash('success', 'Successfully deleted');
    res.redirect('/recipes');
}

module.exports.Login = (req, res, next) => {
  
  User.findOne({ username: req.body.username}, function(err, user) {
    if (!user) {
      req.flash('error', 'Can not find that User');
      return res.redirect('/recipes');
    }
    if (!user.confirmed) {
        req.flash('error','Please confirm your email to login');
        return res.redirect('/recipes');
    }
    passport.authenticate('local', function(err, user) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('/login'); }
      
      
      //res.redirect(redirectUrl);
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        const redirectUrl = req.session.returnTo || '/recipes';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
      });
    })(req, res, next);
  });
  
}

module.exports.Logout = (req, res) => {
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/recipes');
}