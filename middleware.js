const { recipeSchema, reviewSchema} = require('./schemas.js');
const ExpressError = require('./utils/ExpressErrors');
const Recipe = require('./models/recipe');


module.exports.isLoggedIn = (req, res, next) =>{
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl
        req.flash('error','You must be signed in first');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateRecipe = (req, res, next) => {
    //console.log(results);
    const {error} = recipeSchema.validate(req.body);

    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}

// Check if the person perfoming the activity is the author
module.exports.isAuthor = async(req, res, next) =>{
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    if(!recipe.author.equals(req.user._id)){
        req.flash('error', 'You do not have permision to do that');
        return res.redirect(`/recipes/${recipe._id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
   
    //console.log(results);
    const {error} = reviewSchema.validate(req.body);

    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    }else{
        next();
    }
}