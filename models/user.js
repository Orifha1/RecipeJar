const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')
const Recipe = require('./recipe');// This is for the database model
const passportLocalMongoose = require('passport-local-mongoose');

const ImageSchema = new Schema({
    url: String,
    filename: String
});
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_300');
});
const UserSchema = new Schema({
    email:{
        type: String,
        required: true, 
        unique: true
    },
    image: [ImageSchema],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    recipes:[
        {
            type: Schema.Types.ObjectId,
            ref: "Recipe"
        }
    ],
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
    // firstName: String,
    // lastName: String,
});

UserSchema.plugin(passportLocalMongoose);

UserSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        console.log(doc)
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
    if (doc) {
        await Recipe.deleteMany({
            _id: {
                $in: doc.recipes
            }
        })
    }
})

module.exports = mongoose.model('User', UserSchema);