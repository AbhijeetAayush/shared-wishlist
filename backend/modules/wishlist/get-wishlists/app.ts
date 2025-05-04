import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { getUserWishlists } from '../../../utils/wishlist-db-handlers.ts/wishlist';

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

        // Parse query parameters
        const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 10;
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Invalid limit parameter' }),
            };
        }

        // Get user wishlists
        const wishlists = await getUserWishlists(TABLE_NAME, userEmail, limit);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ wishlists }),
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
