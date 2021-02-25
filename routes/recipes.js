const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressErrors');
const Recipe = require('../models/recipe');// This is for the database model
const { recipeSchema} = require('../schemas.js');

const validateRecipe = (req, res, next) => {
    //console.log(results);
    const {error} = recipeSchema.validate(req.body);

    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

//Index Page route - GET
router.get('/', catchAsync(async (req, res) =>{
    //find all the Recipes
    const recipes = await Recipe.find({});
    res.render('recipes/index', {recipes})
}));

//Render form to create a recipe
router.get('/new', (req, res) =>{
    res.render('recipes/new');
});

//Insert new Recipe
router.post('/', validateRecipe, catchAsync(async (req, res) =>{
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const recipe = new Recipe(req.body.recipe)
    await recipe.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`recipes/${recipe._id}`);
}));

// Show recipe detail route - GET
router.get('/:id', catchAsync(async (req, res) =>{
    //find recipe using url paremeter id
    const recipe = await Recipe.findById(req.params.id).populate('reviews');
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', {recipe});
}));

// Edit recipe ROUTE
router.get('/:id/edit', catchAsync(async (req, res) =>{
    const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', {recipe});
}));

//Update a recipe
router.put('/:id', validateRecipe, catchAsync(async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    req.flash('success', 'Successfully updated a recipe');
    res.redirect(`/recipes/${recipe._id}`);
}));

// Delete a recipe
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    req.flash('success', 'Recipe Deleted');
    res.redirect('/recipes');
}));

module.exports = router;