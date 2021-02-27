const express = require('express');
const router = express.Router({mergeParams: true});
const User = require('../models/user')
const catchAsync = require('../utils/catchAsync');

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
module.exports = router;