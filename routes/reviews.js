const express = require('express');
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressErrors');
const Recipe = require('../models/recipe');// This is for the database model
const Review = require('../models/review');
const reviews = require('../controllers/reviews');// This is for the controller
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware');

//Review Post
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));
// Delete review in the recipe show page.
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;