import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { saveItem, getItem } from '../../../utils/aws-lib/ddb-utils';
import * as jwt from 'jsonwebtoken';

const TABLE_NAME = process.env.TABLE_NAME || 'WishlistAppTable';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const connectionId = event.requestContext.connectionId;
        if (!connectionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing connectionId' }),
            };
        }

        const body = event.body ? JSON.parse(event.body) : {};
        const { wishlistId } = body;
        if (!wishlistId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing wishlistId' }),
            };
        }

        // Validate JWT
        const token = event.headers.Authorization?.split(' ')[1];
        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Missing Authorization header' }),
            };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string };
        const userEmail = decoded.email;

        // Verify wishlist access
        const wishlistResult = await getItem(TABLE_NAME, {
            PK: `WISHLIST#${wishlistId}`,
            SK: `WISHLIST#${wishlistId}`,
        });
        if (!wishlistResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Wishlist not found' }),
            };
        }
        if (wishlistResult.Item.createdBy !== userEmail && !wishlistResult.Item.invitedUsers.includes(userEmail)) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        // Save subscription
        await saveItem(TABLE_NAME, {
            PK: `SUBSCRIPTION#${connectionId}`,
            SK: `WISHLIST#${wishlistId}`,
            connectionId,
            wishlistId,
            userEmail,
            createdAt: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Subscribed successfully' }),
        };
    } catch (error: any) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid JWT' }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
