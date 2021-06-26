const express = require('express');
const router = express.Router({mergeParams: true});
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const users = require('../controllers/users');// This is for the controller

//Shortened routes for /register
router.route('/register')
    .get(users.renderRegister) //render register form
    .post(catchAsync(users.register)); //register a new user

//Shortened routes for /login
router.route('/login')
    .get(users.renderLogin) //render login form
    .post(passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), users.Login) //Check login credentials.

//logout user
router.get('/logout', users.Logout);

module.exports = router;