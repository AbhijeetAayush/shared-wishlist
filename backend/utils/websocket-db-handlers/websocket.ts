import { saveItem, getItem, deleteRecordFromTable, queryItems } from '../aws-lib/ddb-utils';

export const saveConnection = async (tableName: string, connectionId: string, userEmail: string) => {
    await saveItem(tableName, {
        PK: `CONNECTION#${connectionId}`,
        SK: `USER#${userEmail}`,
        connectionId,
        userEmail,
        createdAt: new Date().toISOString(),
    });
};

export const deleteConnection = async (tableName: string, connectionId: string, userEmail: string) => {
    await deleteRecordFromTable({
        TableName: tableName,
        Key: { PK: `CONNECTION#${connectionId}`, SK: `USER#${userEmail}` },
    });
};

export const saveSubscription = async (
    tableName: string,
    connectionId: string,
    wishlistId: string,
    userEmail: string,
) => {
    await saveItem(tableName, {
        PK: `SUBSCRIPTION#${connectionId}`,
        SK: `WISHLIST#${wishlistId}`,
        GSI1PK: `SUBSCRIPTION#WISHLIST#${wishlistId}`,
        GSI1SK: `CONNECTION#${connectionId}`,
        connectionId,
        wishlistId,
        userEmail,
        createdAt: new Date().toISOString(),
    });
};

export const deleteSubscription = async (tableName: string, connectionId: string, wishlistId: string) => {
    await deleteRecordFromTable({
        TableName: tableName,
        Key: { PK: `SUBSCRIPTION#${connectionId}`, SK: `WISHLIST#${wishlistId}` },
    });
};

export const getSubscriptionsForWishlist = async (tableName: string, wishlistId: string) => {
    const result = await queryItems({
        tableName,
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :wishlistId',
        expressionAttributeValues: {
            ':wishlistId': `SUBSCRIPTION#WISHLIST#${wishlistId}`,
        },
    });
    return result.items;
};
