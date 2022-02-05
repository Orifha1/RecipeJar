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
        if(page < 0){
            return res.redirect("back");
        }
        const pageSize=12;
        if(!page){
            page =1;
        }
        const skip =(page -1) * parseInt(pageSize);
        
        //find all the Recipes .sort({ _id : -1 })
        const recipes = await Recipe.find({})
                        .sort({ _id : -1 })
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
    let fileChecker = req.files;
    //let bodyCheck = req.files;
    if(fileChecker.length > 4){
        req.flash('error', 'There should be at most four images in a post.');
        return res.redirect('recipes/new');
    }
    if(fileChecker.length < 1){
        req.flash('error', 'There should be atleast one image in a post.');
        return res.redirect('recipes/new');
    }
    for(let filecheck in fileChecker){
        // let finalCheck =fileChecker[filecheck].originalname;
        if(!fileChecker[filecheck].originalname.match(/.(jpg|jpeg|png|gif)$/i)){
            req.flash('error', 'Image type(format) is not accepted');
            return res.redirect('recipes/new');
        }
    }
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
    return res.redirect(`recipes/${recipe._id}`);
}

module.exports.showRecipe = async (req, res) =>{
    try{
        const recipe1 = await Recipe.findById(req.params.id);
        
        //find recipe using url paremeter id
        const recipe = await Recipe.findById(req.params.id).populate({
            path: 'reviews',
            populate: {//populate author of the reviewer.
                path: 'author' 
            }
        }).populate('author')//populate author the recipe shown.
            .populate('likes');

        let dateCreated = recipe._id.getTimestamp();

        year = dateCreated.getFullYear();
        month = dateCreated.getMonth()+1;
        dt = dateCreated.getDate();

        recipecreatedDate = year+'-' + month + '-'+dt;

        if(!recipe){
            req.flash('error', 'Can not find that Recipe');
            return res.redirect('/recipes');
        }
        let isLoggedInUser = req.user; 
        let existingLiker = recipe1.likes;
        let likeStatus = false;

        if(typeof isLoggedInUser === 'undefined'){
            return res.render('recipes/show', {recipe, likeStatus});
        }

        if(existingLiker.includes(req.user._id)){
            likeStatus = true;
        }else{
            likeStatus = false;
        }
        
        return res.render('recipes/show', {recipe, likeStatus, recipecreatedDate});
    }catch(err){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }

}

module.exports.renderEditForm = async (req, res) =>{
    const { id } = req.params;
    const recipe = await Recipe.findById(id).catch(err => {return res.redirect('/recipes')});
    //const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', {recipe});
}

module.exports.updateRecipe = async (req, res) => {
    let fileChecker = req.files;
    let deleteFiles =req.body.deleteImages;
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    
    for(let filecheck in fileChecker){
        // let finalCheck =fileChecker[filecheck].originalname;
        if(!fileChecker[filecheck].originalname.match(/.(jpg|jpeg|png|gif)$/i)){
            req.flash('error', 'Image type(format) is not accepted');
            return res.redirect(`/recipes/${recipe._id}/edit`);
        }
    }
    
    const imageCheckerValue = await Recipe.findById(id);
    let imagesBody = imageCheckerValue.images;
    if(imagesBody.length + fileChecker.length > 4){
        req.flash('error', 'There should be at most four images in a post.');
        return res.redirect(`/recipes/${recipe._id}/edit`);
    }
    if (req.body.deleteImages) {
        if(imagesBody.length - deleteFiles.length == 0){
            req.flash('error', 'There should be atleast one image. Did you want to delete the whole post?');
            return res.redirect(`/recipes/${recipe._id}/edit`);
        }
    }
    
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    
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
    return res.redirect(`/recipes/${recipe._id}`);
}

module.exports.deleteRecipe = async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    await Recipe.findByIdAndDelete(id);
    for (let images of recipe.images) {
        await cloudinary.uploader.destroy(images.filename);
    }    
    req.flash('success', 'Successfully deleted');
    return res.redirect('/recipes');
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};