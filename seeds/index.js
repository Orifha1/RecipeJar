const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Recipe = require('../models/recipe');

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

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Recipe.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const ingredient = "Meat and Stuff";
        const rec = new Recipe({
            author: '6143aa4d4b20df66cc40b6e2',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            ingredient,
            images: [
                {
                  url: 'https://res.cloudinary.com/ducb3ne4n/image/upload/v1624728000/RecipeJar/ogmevwmylh1zmgbcsfvf.jpg',
                  filename: 'RecipeJar/ogmevwmylh1zmgbcsfvf'
                },
                {
                  url: 'https://res.cloudinary.com/ducb3ne4n/image/upload/v1624728004/RecipeJar/z3ucmtu8ximf0eusle4u.jpg',
                  filename: 'RecipeJar/z3ucmtu8ximf0eusle4u'
                }
              ],
        })
        await rec.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})