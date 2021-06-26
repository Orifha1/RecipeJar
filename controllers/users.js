
const User = require('../models/user');

module.exports.renderRegister = (req,res) =>{
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try{
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if(err){
                return next(err);
            }
            req.flash('success','Welcome to RecipeJar');
            res.redirect('/recipes');
        });
    }catch(e){
        req.flash('error',e.message);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.Login = (req, res) => {
    const redirectUrl = req.session.returnTo || '/recipes';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.Logout = (req, res) => {
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/recipes');
}