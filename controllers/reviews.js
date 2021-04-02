const Review = require('../models/review');// This is for the database model
const Recipe = require('../models/recipe');// This is for the database model
module.exports.createReview = async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    req.flash('success', 'New review created');
    res.redirect(`/recipes/${recipe._id}`);

}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Recipe.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findOneAndDelete(reviewId);
    req.flash('success', 'Review Deleted');
    res.redirect(`/recipes/${id}`);
}