import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { saveItem } from '../../../utils/aws-lib/ddb-utils';

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

        // Validate JWT
        const token = event.queryStringParameters?.token;
        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Missing token' }),
            };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string };
        const userEmail = decoded.email;

        // Save connection
        await saveItem(TABLE_NAME, {
            PK: `CONNECTION#${connectionId}`,
            SK: `USER#${userEmail}`,
            connectionId,
            userEmail,
            createdAt: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected successfully' }),
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
