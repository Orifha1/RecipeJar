const express = require('express');
const router = express.Router();

//Landing Page Route - GET
router.get('/', (req, res) =>{
    return res.redirect('/recipes');
});

//About us page. 
router.get('/about', (req, res) =>{
    return res.render('about');
});

router.get('/terms', (req, res) =>{
    return res.render('terms');
});
router.get('/privacy', (req, res) =>{
    return res.render('privacy');
});
// router.get('/notifications', (req, res) =>{
//     return res.render('notification');
// });
module.exports = router;
