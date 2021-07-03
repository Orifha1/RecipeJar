if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash')
const Joi = require('joi');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressErrors');
const Recipe = require('./models/recipe');// This is for the database model
const Review = require('./models/review');
const { join } = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
//Routes required
const recipesRoutes = require('./routes/recipes');// These is the route import for recipes pages
const reviewsRoutes = require('./routes/reviews');// These is the route import for reviews routes
const userRoutes = require('./routes/users');

//Mongoose Connection 
mongoose.connect('mongodb://localhost:27017/rec-jar', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
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
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

//passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

//serialize and deserialize user(How to store and unstore user)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => { 
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//Routes
app.use('/', userRoutes);
app.use('/recipes', recipesRoutes);
app.use('/recipes/:id/reviews', reviewsRoutes);

//Landing Page Route - GET
app.get('/', (req, res) =>{
    return res.redirect('/recipes');
});

//For every single request
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

//Error handling
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
});

//Listening Port for Server
app.listen(3000, () => {
    console.log("APP IS LISTENING ON PORT 3000!")
});