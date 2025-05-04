import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getItem } from '../../../utils/aws-lib/ddb-utils';
import { addProduct, updateProduct, deleteProduct } from '../../../utils/product-db-handlers/products';
import { validateAddProduct, validateUpdateProduct } from '../routes/products';

const TABLE_NAME = process.env.TABLE_NAME || 'WishlistAppTable';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Validate JWT
        const token = event.headers.Authorization?.split(' ')[1];
        if (!token) {
            return {
                statusCode: 401,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Missing Authorization header' }),
            };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string };
        const userEmail = decoded.email;

        const wishlistId = event.pathParameters?.wishlistId;
        const productId = event.pathParameters?.productId;
        if (!wishlistId) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Missing wishlistId' }),
            };
        }

        // Verify wishlist exists and user is authorized
        const wishlistResult = await getItem(TABLE_NAME, {
            PK: `WISHLIST#${wishlistId}`,
            SK: `WISHLIST#${wishlistId}`,
        });
        if (!wishlistResult.Item) {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Wishlist not found' }),
            };
        }
        if (wishlistResult.Item.createdBy !== userEmail && !wishlistResult.Item.invitedUsers.includes(userEmail)) {
            return {
                statusCode: 403,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        if (event.httpMethod === 'POST') {
            const body = event.body ? JSON.parse(event.body) : {};
            const { error } = validateAddProduct(body);
            if (error) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: error.details[0].message }),
                };
            }

            const { productName, imageUrl, price } = body;
            const newProductId = uuidv4();

            await addProduct(TABLE_NAME, wishlistId, newProductId, productName, imageUrl, price, userEmail);

            return {
                statusCode: 201,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Product added successfully', productId: newProductId }),
            };
        }

        if (event.httpMethod === 'PUT') {
            if (!productId) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: 'Missing productId' }),
                };
            }

            const body = event.body ? JSON.parse(event.body) : {};
            const { error } = validateUpdateProduct(body);
            if (error) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: error.details[0].message }),
                };
            }

            const { productName, imageUrl, price } = body;

            await updateProduct(TABLE_NAME, wishlistId, productId, productName, imageUrl, price, userEmail);

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Product updated successfully', productId }),
            };
        }

        if (event.httpMethod === 'DELETE') {
            if (!productId) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: 'Missing productId' }),
                };
            }

            await deleteProduct(TABLE_NAME, wishlistId, productId, userEmail);

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Product deleted successfully', productId }),
            };
        }

        return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Method not found' }),
        };
    } catch (error: any) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Invalid JWT' }),
            };
        }
        if (error.message === 'Product not found' || error.message === 'Unauthorized') {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: error.message }),
            };
        }
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
