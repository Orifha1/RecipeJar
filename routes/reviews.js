const express = require('express');
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressErrors');
const Recipe = require('../models/recipe');// This is for the database model
const Review = require('../models/review');
const { reviewSchema} = require('../schemas.js');

const validateReview = (req, res, next) => {
   
    //console.log(results);
    const {error} = reviewSchema.validate(req.body);

    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}
//Review Post
router.post('/', validateReview, catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    const review = new Review(req.body.review);
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    req.flash('success', 'New review created');
    res.redirect(`/recipes/${recipe._id}`);

}))

router.delete('/:reviewId',catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Recipe.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findOneAndDelete(reviewId);
    req.flash('success', 'Review Deleted');
    res.redirect(`/recipes/${id}`);
}))

module.exports = router;