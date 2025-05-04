import { DynamoDBStreamEvent } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { queryItems, deleteRecordFromTable } from '../../../utils/aws-lib/ddb-utils';

const TABLE_NAME = process.env.TABLE_NAME || 'WishlistAppTable';
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT || '';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: WEBSOCKET_API_ENDPOINT,
    });

    for (const record of event.Records) {
        if (record.eventName === 'INSERT' || record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
            const newImage = record.dynamodb?.NewImage;
            const oldImage = record.dynamodb?.OldImage;
            const pk = newImage?.PK?.S || oldImage?.PK?.S;
            const sk = newImage?.SK?.S || oldImage?.SK?.S;

            if (!pk || !sk) continue;

            let wishlistId: string | undefined;
            if (pk.startsWith('WISHLIST#') && sk.startsWith('WISHLIST#')) {
                wishlistId = pk.replace('WISHLIST#', '');
            } else if (pk.startsWith('WISHLIST#') && sk.startsWith('PRODUCT#')) {
                wishlistId = pk.replace('WISHLIST#', '');
            }

            if (!wishlistId) continue;

            // Get all subscriptions for the wishlist
            const subscriptions = await queryItems({
                tableName: TABLE_NAME,
                indexName: 'GSI1',
                keyConditionExpression: 'GSI1PK = :wishlistId',
                expressionAttributeValues: {
                    ':wishlistId': `SUBSCRIPTION#WISHLIST#${wishlistId}`,
                },
            });

            const message = {
                action: record.eventName.toLowerCase(),
                data: newImage || oldImage,
            };

            // Broadcast to all subscribed connections
            for (const subscription of subscriptions.items) {
                const connectionId = subscription.connectionId;
                try {
                    await client.send(
                        new PostToConnectionCommand({
                            ConnectionId: connectionId,
                            Data: JSON.stringify(message),
                        }),
                    );
                } catch (error: any) {
                    if (error.statusCode === 410) {
                        // Connection is gone, remove subscription
                        await deleteRecordFromTable({
                            TableName: TABLE_NAME,
                            Key: { PK: `SUBSCRIPTION#${connectionId}`, SK: `WISHLIST#${wishlistId}` },
                        });
                    } else {
                        console.error('Error sending message to connection:', error);
                    }
                }
            }
        }
    }
};
