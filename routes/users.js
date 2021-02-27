const express = require('express');
const router = express.Router({mergeParams: true});
const User = require('../models/user')
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');

//render register form
router.get('/register', (req,res) =>{
    res.render('users/register');
});

//register a new user
router.post('/register', catchAsync(async (req, res) => {
    try{
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.flash('success','Welcome to RecipeJar');
        res.redirect('/recipes');
    }catch(e){
        req.flash('error',e.message);
        res.redirect('/register');
    }
}));
//render login form
router.get('/login', (req, res) => {
    res.render('users/login');
});
//Check login credentials.
router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), (req, res) => {
    req.flash('success', 'Welcome back');
    res.redirect('/recipes');
});
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/recipes');
});
module.exports = router;