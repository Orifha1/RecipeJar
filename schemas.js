const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.recipeSchema = Joi.object({
    recipe: Joi.object({
        title: Joi.string().required().escapeHTML(),
        ingredient: Joi.string().escapeHTML(),
        // image: Joi.string().required(),
        // location: Joi.string(),
        // description: Joi.string()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(0).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
})

module.exports.UserSchema = Joi.object({
    user: Joi.object({
        password: Joi.number().min(8).max(15).required(),
    }).required()
})