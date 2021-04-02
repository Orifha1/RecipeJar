const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Recipe = require('../models/recipe');// This is for the database model
const recipes = require('../controllers/recipes'); 
const {isLoggedIn, isAuthor, validateRecipe} = require('../middleware');


//Index Page route - GET
router.get('/', catchAsync(recipes.index));

//Render form to create a recipe
router.get('/new', isLoggedIn, recipes.renderNewForm);

//Insert new Recipe
router.post('/', isLoggedIn, validateRecipe, catchAsync(recipes.createRecipe));

// Show recipe detail route - GET
router.get('/:id', catchAsync(recipes.showRecipe));

// Edit recipe ROUTE
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(recipes.renderEditForm));

//Update a recipe
router.put('/:id', isLoggedIn, isAuthor, validateRecipe, catchAsync(recipes.updateRecipe));

// Delete a recipe
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(recipes.deleteRecipe));

module.exports = router;