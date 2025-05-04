import { getItem, saveItem, updateItem, deleteRecordFromTable, queryItems } from '../aws-lib/ddb-utils';

export const createWishlist = async (
    tableName: string,
    wishlistId: string,
    wishlistName: string,
    createdBy: string,
) => {
    const wishlistItem = {
        PK: `WISHLIST#${wishlistId}`,
        SK: `WISHLIST#${wishlistId}`,
        GSI1PK: `USER#${createdBy}`,
        GSI1SK: `WISHLIST#${wishlistId}`,
        wishlistName,
        createdBy,
        invitedUsers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await saveItem(tableName, wishlistItem);
};

export const getUserWishlists = async (tableName: string, userEmail: string, limit: number, cursor?: any) => {
    const result = await queryItems({
        tableName,
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :userEmail',
        expressionAttributeValues: {
            ':userEmail': `USER#${userEmail}`,
        },
        limit,
        exclusiveStartKey: cursor,
    });

    return {
        wishlists: result.items,
        nextCursor: result.lastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
            : null,
    };
};

export const updateWishlist = async (
    tableName: string,
    wishlistId: string,
    wishlistName: string,
    userEmail: string,
) => {
    const result = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` });
    if (!result.Item) {
        throw new Error('Wishlist not found');
    }
    if (result.Item.createdBy !== userEmail && !result.Item.invitedUsers.includes(userEmail)) {
        throw new Error('Unauthorized');
    }

    await updateItem({
        tableName,
        key: { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` },
        updateExpression: 'SET wishlistName = :name, updatedAt = :updatedAt',
        expressionAttributeValues: {
            ':name': wishlistName,
            ':updatedAt': new Date().toISOString(),
        },
    });
};

export const deleteWishlist = async (tableName: string, wishlistId: string, userEmail: string) => {
    const result = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` });
    if (!result.Item) {
        throw new Error('Wishlist not found');
    }
    if (result.Item.createdBy !== userEmail && !result.Item.invitedUsers.includes(userEmail)) {
        throw new Error('Unauthorized');
    }

    await deleteRecordFromTable({
        TableName: tableName,
        Key: { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` },
    });
};

export const inviteUserToWishlist = async (
    tableName: string,
    wishlistId: string,
    userEmail: string,
    invitedEmail: string,
) => {
    const result = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` });
    if (!result.Item) {
        throw new Error('Wishlist not found');
    }
    if (result.Item.createdBy !== userEmail) {
        throw new Error('Unauthorized');
    }

    const updatedInvitedUsers = [...new Set([...result.Item.invitedUsers, invitedEmail])];

    await updateItem({
        tableName,
        key: { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` },
        updateExpression: 'SET invitedUsers = :invitedUsers, updatedAt = :updatedAt',
        expressionAttributeValues: {
            ':invitedUsers': updatedInvitedUsers,
            ':updatedAt': new Date().toISOString(),
        },
    });
};
