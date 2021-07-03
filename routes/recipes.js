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

//Shortened routes for /:id
router.route('/:id')
    .get(catchAsync(recipes.showRecipe)) // Show recipe detail route - GET
    .put(isLoggedIn, isAuthor, upload.array('image'), validateRecipe, catchAsync(recipes.updateRecipe)) //Update a recipe
    .delete(isLoggedIn, isAuthor, catchAsync(recipes.deleteRecipe)) //Delete a recipe

// Edit recipe ROUTE
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(recipes.renderEditForm));

module.exports = router;