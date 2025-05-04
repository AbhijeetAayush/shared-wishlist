import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteRecordFromTable } from '../../../utils/aws-lib/ddb-utils';

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

        await deleteRecordFromTable({
            TableName: TABLE_NAME,
            Key: { PK: `CONNECTION#${connectionId}`, SK: `USER#${event.requestContext.authorizer?.principalId}` },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected successfully' }),
        };
    } catch (error: any) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
