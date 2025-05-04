import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createWishlist } from '../../../utils/wishlist-db-handlers.ts/wishlist';
import { validateCreateWishlist } from '../routes/wishlist';

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

        // Parse and validate request body
        const body = event.body ? JSON.parse(event.body) : {};
        const { error } = validateCreateWishlist(body);
        if (error) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: error.details[0].message }),
            };
        }

        const { wishlistName } = body;
        const wishlistId = uuidv4();

        // Create wishlist
        await createWishlist(TABLE_NAME, wishlistId, wishlistName, userEmail);

        return {
            statusCode: 201,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Wishlist created successfully', wishlistId }),
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
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
