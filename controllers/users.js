
const User = require('../models/user');
const { cloudinary } = require("../cloudinary");
const recipes = require('../controllers/recipes'); 
const Recipe = require('../models/recipe');// This is for the database model


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
    const user = await User.findById(req.params.id).populate('followers').exec();
    const recipes = await Recipe.find({}).where('author').equals(user._id);
    res.render("users/show", {user, recipes});
    // for(let rec in recipes){
    //   if (`${recipes[rec].author}` == user._id){
    //     console.log(`${recipes[rec]}`);
    //   }
    // }
  };

module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body.user);
    //console.log(user);
        if (!user) {
            req.flash('error', 'Can not find that User');
            res.redirect('/recipes');
        }
        await user.save();
        req.flash('success', 'Your profile has been updated');
        res.redirect(`/users/${user._id}`);
  
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