import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { updateWishlist, deleteWishlist } from '../../../utils/wishlist-db-handlers.ts/wishlist';
import { validateUpdateWishlist } from '../routes/wishlist';

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
        if (!wishlistId) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Missing wishlistId' }),
            };
        }

        if (event.httpMethod === 'PUT') {
            // Parse and validate request body
            const body = event.body ? JSON.parse(event.body) : {};
            const { error } = validateUpdateWishlist(body);
            if (error) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: error.details[0].message }),
                };
            }

            const { wishlistName } = body;

            // Update wishlist
            await updateWishlist(TABLE_NAME, wishlistId, wishlistName, userEmail);

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Wishlist updated successfully', wishlistId }),
            };
        }

        if (event.httpMethod === 'DELETE') {
            // Delete wishlist
            await deleteWishlist(TABLE_NAME, wishlistId, userEmail);

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Wishlist deleted successfully', wishlistId }),
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
        if (error.message === 'Wishlist not found' || error.message === 'Unauthorized') {
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
