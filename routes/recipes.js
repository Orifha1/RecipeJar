const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Recipe = require('../models/recipe');// This is for the database model

const {isLoggedIn, isAuthor, validateRecipe} = require('../middleware');


//Index Page route - GET
router.get('/', catchAsync(async (req, res) =>{
    //find all the Recipes
    const recipes = await Recipe.find({});
    res.render('recipes/index', {recipes})
}));

//Render form to create a recipe
router.get('/new', isLoggedIn, (req, res) =>{
    res.render('recipes/new');
});

//Insert new Recipe
router.post('/', isLoggedIn, validateRecipe, catchAsync(async (req, res) =>{
    const recipe = new Recipe(req.body.recipe)
    recipe.author = req.user._id;
    await recipe.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`recipes/${recipe._id}`);
}));

// Show recipe detail route - GET
router.get('/:id', catchAsync(async (req, res) =>{
    //find recipe using url paremeter id
    const recipe = await Recipe.findById(req.params.id).populate('reviews').populate('author');
    console.log(recipe);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', {recipe});
}));

// Edit recipe ROUTE
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) =>{
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    //const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', {recipe});
}));

//Update a recipe
router.put('/:id', isLoggedIn, isAuthor, validateRecipe, catchAsync(async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    req.flash('success', 'Successfully updated a recipe');
    res.redirect(`/recipes/${recipe._id}`);
}));

// Delete a recipe
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    req.flash('success', 'Recipe Deleted');
    res.redirect('/recipes');
}));

module.exports = router;