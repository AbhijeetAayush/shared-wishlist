import * as Joi from 'joi';

export const validateAddProduct = (data: any) => {
    const schema = Joi.object({
        productName: Joi.string().min(1).required(),
        imageUrl: Joi.string().uri().required(),
        price: Joi.number().positive().required(),
    });
    return schema.validate(data);
};

export const validateUpdateProduct = (data: any) => {
    const schema = Joi.object({
        productName: Joi.string().min(1).optional(),
        imageUrl: Joi.string().uri().optional(),
        price: Joi.number().positive().optional(),
    }).min(1); // At least one field required
    return schema.validate(data);
};
