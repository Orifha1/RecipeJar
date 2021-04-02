const express = require('express');
const router = express.Router({mergeParams: true});
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const users = require('../controllers/users');// This is for the controller
//render register form
router.get('/register', users.renderRegister);

//register a new user
router.post('/register', catchAsync(users.register));
//render login form
router.get('/login', users.renderLogin);
//Check login credentials.
router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), users.Login);
//logout user
router.get('/logout', users.Logout);
module.exports = router;