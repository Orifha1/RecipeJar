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
const MongoStore = require('connect-mongo');
//const dbUrl = 'mongodb://localhost:27017/rec-jar';
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/rec-jar';
//Routes required
const recipesRoutes = require('./routes/recipes');// These is the route import for recipes pages
const reviewsRoutes = require('./routes/reviews');// These is the route import for reviews routes
const userRoutes = require('./routes/users');
const indexRoutes = require('./routes/index');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");

//Mongoose Connection 
mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/rec-jar', {
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
app.use(mongoSanitize());
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60,
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://cdn.tiny.cloud",
    "https://www.googletagmanager.com",
    "https://www.google-analytics"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
    "https://cdn.tiny.cloud"
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
    "https://www.google-analytics.com"
];
const fontSrcUrls = [
    "https://fonts.gstatic.com",
    "https://cdnjs.cloudflare.com",
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/ducb3ne4n/", 
                "https://images.unsplash.com",
                "https://cdn.pixabay.com",
                "https://sp.tinymce.com"
            ],
            fontSrc: ["'self'", "data:", ...fontSrcUrls],
        },
    })
);

//passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

//serialize and deserialize user(How to store and unstore user)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async (req, res, next) => {
    if(!['/login', '/register'].includes(req.originalUrl)){
        req.session.returnTo = req.originalUrl; // store where the user is is coming from in the session. 
    } 
    res.locals.currentUser = req.user;
    if(req.user) {
        try {
          let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
          res.locals.notifications = user.notifications.reverse();
        } catch(err) {
          console.log(err.message);
        }
    }
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//Routes
app.use('/', userRoutes);
app.use('/', indexRoutes);
app.use('/recipes', recipesRoutes);
// app.use('/recipes/:id/like', recipesRoutes);
app.use('/', recipesRoutes);
app.use('/unlike/:id', recipesRoutes);
app.use('/recipes/:id/reviews', reviewsRoutes);


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
const port = process.env.PORT || 3000;
//Listening Port for Server
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
});