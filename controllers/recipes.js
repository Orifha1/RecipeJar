//This folder is created to cleen up the code so that the functionality can be called as methods in the routes folder.

const Recipe = require('../models/recipe');// This is for the database model
const { cloudinary } = require("../cloudinary");
const User = require('../models/user');
var Notification = require("../models/notification");

module.exports.index = async (req, res) =>{
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        let page =  parseInt(req.query.page);
        if(page < 0) {
            return res.redirect("back");
        }
        const pageSize=12;
        if(!page){
            page =1;
        }
        const skip =(page -1) * parseInt(pageSize);
        // if(skip < 0) {
        //     return res.redirect("back");
        // }
        //find all the Recipes .sort({ _id : -1 })
        const recipes = await Recipe.find({ $or:[{title: regex},{location: regex}]})
                        .populate('author')
                        .limit(pageSize * 1)
                        .skip(skip);

        if(recipes.length < 1) {
            req.flash('error', 'Can not find that Recipe');
            return res.redirect("back");
        }
        res.render('recipes/index', {recipes, page});
    }else{
        let page =  parseInt(req.query.page);
        const pageSize=12;
        if(!page){
            page =1;
        }
        const skip =(page -1) * parseInt(pageSize);
        
        //find all the Recipes .sort({ _id : -1 })
        const recipes = await Recipe.find({})
                        .populate('author')
                        .limit(pageSize * 1)
                        .skip(skip);
        res.render('recipes/index', {recipes, page});
    }
}

module.exports.renderNewForm = (req, res) =>{
    res.render('recipes/new');
}

module.exports.createRecipe = async (req, res) =>{

    const recipe = new Recipe(req.body.recipe);
    if(recipe.ingredient === '') {
        recipe.ingredient = undefined;
    }
    if(recipe.description === '') {
        recipe.description  = undefined;
    }
    if(recipe.location === '') {
        recipe.location = undefined;
    }
    const user = await User.findById(req.user._id).populate('followers').exec();
    let newNotification = {
        username: req.user.username,
        recipeId: recipe.id
    }
    for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
    }
    recipe.images =  req.files.map(f => ({ url:f.path, filename:f.filename }))
    recipe.author = req.user._id;
    user.recipes.push(recipe);

    await recipe.save();
    await user.save();

    req.flash('success', 'Successfully made a new Recipe!');
    res.redirect(`recipes/${recipe._id}`);
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

module.exports.renderEditForm = async (req, res) =>{
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    //const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', {recipe});
}

module.exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    const img = req.files.map(f => ({ url:f.path, filename:f.filename }));
    recipe.images.push(...img);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await recipe.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    await recipe.save();
    req.flash('success', 'Successfully updated a recipe');
    res.redirect(`/recipes/${recipe._id}`);
}


module.exports.deleteRecipe = async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted');
    res.redirect('/recipes');
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};