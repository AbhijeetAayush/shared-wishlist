import * as Joi from 'joi';

export const validateCreateWishlist = (data: any) => {
    const schema = Joi.object({
        wishlistName: Joi.string().min(1).required(),
    });
    return schema.validate(data);
};

export const validateUpdateWishlist = (data: any) => {
    const schema = Joi.object({
        wishlistName: Joi.string().min(1).required(),
    });
    return schema.validate(data);
};

export const validateInviteWishlist = (data: any) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
    });
    return schema.validate(data);
};
