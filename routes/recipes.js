const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Recipe = require('../models/recipe');// This is for the database model
const recipes = require('../controllers/recipes'); 
const {isLoggedIn, isAuthor, validateRecipe} = require('../middleware');
const multer  = require('multer');
const {storage} = require('../cloudinary')
const upload = multer({storage});

//shortened routes for / 
router.route('/')
    .get(catchAsync(recipes.index))//Index Page route - GET
    .post(isLoggedIn, upload.array('image'), validateRecipe, catchAsync(recipes.createRecipe))//Insert new Recipe
    // .post(upload.array('image'),(req, res) => {
    //     console.log(req.body, req.files);
    //     res.send("It works")
    // })

//Render form to create a recipe. This has to go before the show route because it thinks new is an id if it didn't go first. 
router.get('/new', isLoggedIn, recipes.renderNewForm);

router.get('/like/:id',isLoggedIn, async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    let existingLiker = recipe.likes;

    if(existingLiker.includes(req.user._id)){
        await Recipe.findByIdAndUpdate(req.params.id, {$pull: {likes: req.user._id} });
        req.flash('success', 'Successfully unliked ' + recipe.title + '!');
        return res.redirect(`/recipes/${recipe._id}`);
    }else{
        recipe.likes.addToSet(req.user._id);
        recipe.save();
        req.flash('success', 'Successfully liked ' + recipe.title + '!');
        return res.redirect(`/recipes/${recipe._id}`);
    }
    //let recipeArray = recipe.likes;
    // let finale = recipeArray[0];
    // console.log("try: ", finale);
    //console.log("test : ", test.user);
    //if the post has already been liked by that user
    // if(recipe.likes.filter(like => like.user.toStrng() === req.user.id).length > 0) {
    //     req.flash('error', 'Post already liked.');
    //     return res.redirect(`/recipes/${recipe._id}`);
    // }
    // recipe.likes.push({user: req.user.id});
    // await recipe.save();
    // req.flash('error', 'Success');
    // return res.redirect('back');
});
//Shortened routes for /:id
router.route('/:id')
    .get(catchAsync(recipes.showRecipe)) // Show recipe detail route - GET
    .put(isLoggedIn, isAuthor, upload.array('image'), validateRecipe, catchAsync(recipes.updateRecipe)) //Update a recipe
    .delete(isLoggedIn, isAuthor, catchAsync(recipes.deleteRecipe)) //Delete a recipe

// Like a Recipe

//Unlike a recipe

// router.put('/unlike/:id', async (req, res) => {
//     const recipe = await Recipe.findById(req.params.id);

//     //if the post has already been liked by that user
//     if(recipe.likes.filter(like => like.user.toStrng() === req.user.id).length === 0) {
//         req.flash('error', 'Post has not yet been liked.');
//         return res.redirect('back');
//     }
//     // Get Remove index
//     const removeIndex = recipe.likes.map(like => like.user.toStrng()).indexof(req.user.id);
//     this.recipe.likes.splice(removeIndex, 1);
//     await recipe.save();
//     req.flash('error', 'Success');
//     return res.redirect('back');
// });

// Edit recipe ROUTE
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(recipes.renderEditForm));

module.exports = router;