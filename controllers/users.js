
const User = require('../models/user');
const { cloudinary } = require("../cloudinary");


module.exports.renderRegister = (req,res) =>{
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try{
        const {email, username, password, image} = req.body;
        const user = new User({email, username, image});
        const registeredUser = await User.register(user, password);
        user.image =  req.files.map(f => ({ url:f.path, filename:f.filename }));
        req.login(registeredUser, err => {
            if(err){
                return next(err);
            }
            req.flash('success','Welcome to RecipeJar');
            res.redirect('/recipes');
        });
    }catch(e){
        req.flash('error',e.message);
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
    console.log(recipe);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', {recipe});
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.Login = (req, res) => {
    const redirectUrl = req.session.returnTo || '/recipes';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.Logout = (req, res) => {
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/recipes');
}