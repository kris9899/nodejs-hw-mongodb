import Joi from 'joi';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])'))
    .min(6)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one letter and one number',
    }),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
