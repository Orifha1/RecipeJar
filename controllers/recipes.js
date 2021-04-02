//This folder is created to cleen up the code so that the functionality can be called as methods in the routes folder.

const Recipe = require('../models/recipe');// This is for the database model

module.exports.index = async (req, res) =>{
    //find all the Recipes
    const recipes = await Recipe.find({});
    res.render('recipes/index', {recipes});
}

module.exports.renderNewForm = (req, res) =>{
    res.render('recipes/new');
}

module.exports.createRecipe = async (req, res) =>{
    const recipe = new Recipe(req.body.recipe)
    recipe.author = req.user._id;
    await recipe.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`recipes/${recipe._id}`);
}

module.exports.showRecipe = async (req, res) =>{
    //find recipe using url paremeter id
    const recipe = await Recipe.findById(req.params.id).populate({
        path: 'reviews',
        populate: {//populate author of the reviewer.
            path: 'author'
        }
    }).populate('author');//populate author the recipe shown.
    console.log(recipe);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', {recipe});
}

module.exports.renderEditForm = async (req, res) =>{
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    //const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        req.flash('error', 'Can not find that Recipe');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', {recipe});
}

module.exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    req.flash('success', 'Successfully updated a recipe');
    res.redirect(`/recipes/${recipe._id}`);
}


module.exports.deleteRecipe = async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    req.flash('success', 'Recipe Deleted');
    res.redirect('/recipes');
}
