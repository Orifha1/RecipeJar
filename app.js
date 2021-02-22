const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const { recipeSchema, reviewSchema} = require('./schemas.js');
const methodOverride = require('method-override');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressErrors');
const Recipe = require('./models/recipe');
const Review = require('./models/review');
const { join } = require('path');
const recipe = require('./models/recipe');

//Mongoose Connection 
mongoose.connect('mongodb://localhost:27017/rec-jar', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


//Views path setup - Using ejs templating
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Parse the body - E.g req.body parsed to ejs template
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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
//Landing Page Route - GET
app.get('/', (req, res) =>{
    res.render('home')
});

//Index Page route - GET
app.get('/recipes', catchAsync(async (req, res) =>{
    //find all the Recipes
    const recipes = await Recipe.find({});
    res.render('recipes/index', {recipes})
}));

//Render form to create a recipe
app.get('/recipes/new', (req, res) =>{
    res.render('recipes/new');
});

//Insert new Recipe
app.post('/recipes', validateRecipe, catchAsync(async (req, res) =>{
    
    const recipe = new Recipe(req.body.recipe)
    await recipe.save();
    res.redirect(`recipes/${recipe._id}`);
}));


// Show recipe detail route - GET
app.get('/recipes/:id', catchAsync(async (req, res) =>{
    //find recipe using url paremeter id
    const recipe = await Recipe.findById(req.params.id).populate('reviews');
    res.render('recipes/show', {recipe});
}));

// Edit recipe ROUTE
app.get('/recipes/:id/edit', catchAsync(async (req, res) =>{
    const recipe = await Recipe.findById(req.params.id);
    res.render('recipes/edit', {recipe});
}));


//Update a recipe
app.put('/recipes/:id', validateRecipe, catchAsync(async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    res.redirect(`/recipes/${recipe._id}`);
}));

//Review Post
app.post('/recipes/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    const review = new Review(req.body.review);
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    res.redirect(`/recipes/${recipe._id}`)

}))

app.delete('/recipes/:id/reviews/:reviewId',catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await recipe.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findOneAndDelete(reviewId);
    res.redirect(`/recipes/${id}`)
}))
// Delete a recipe
app.delete('/recipes/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.redirect('/recipes');
}));


//For every single request
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

//Error handling
app.use((err, req, res, next) => {

    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})


//Listening Port for Server
app.listen(3000, () => {
    console.log("APP IS LISTENING ON PORT 3000!")
})