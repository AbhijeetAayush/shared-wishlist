import { getItem, saveItem, updateItem, deleteRecordFromTable } from '../aws-lib/ddb-utils';

export const addProduct = async (
    tableName: string,
    wishlistId: string,
    productId: string,
    productName: string,
    imageUrl: string,
    price: number,
    addedBy: string,
) => {
    const productItem = {
        PK: `WISHLIST#${wishlistId}`,
        SK: `PRODUCT#${productId}`,
        productName,
        imageUrl,
        price,
        addedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await saveItem(tableName, productItem);
};

export const updateProduct = async (
    tableName: string,
    wishlistId: string,
    productId: string,
    productName: string | undefined,
    imageUrl: string | undefined,
    price: number | undefined,
    userEmail: string,
) => {
    const result = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `PRODUCT#${productId}` });
    if (!result.Item) {
        throw new Error('Product not found');
    }

    const wishlistResult = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` });
    if (!wishlistResult.Item) {
        throw new Error('Wishlist not found');
    }
    if (wishlistResult.Item.createdBy !== userEmail && !wishlistResult.Item.invitedUsers.includes(userEmail)) {
        throw new Error('Unauthorized');
    }

    const updateExpressionParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': new Date().toISOString(),
    };

    if (productName) {
        updateExpressionParts.push('productName = :productName');
        expressionAttributeValues[':productName'] = productName;
    }
    if (imageUrl) {
        updateExpressionParts.push('imageUrl = :imageUrl');
        expressionAttributeValues[':imageUrl'] = imageUrl;
    }
    if (price) {
        updateExpressionParts.push('price = :price');
        expressionAttributeValues[':price'] = price;
    }
    updateExpressionParts.push('updatedAt = :updatedAt');

    await updateItem({
        tableName,
        key: { PK: `WISHLIST#${wishlistId}`, SK: `PRODUCT#${productId}` },
        updateExpression: `SET ${updateExpressionParts.join(', ')}`,
        expressionAttributeValues,
    });
};

export const deleteProduct = async (tableName: string, wishlistId: string, productId: string, userEmail: string) => {
    const result = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `PRODUCT#${productId}` });
    if (!result.Item) {
        throw new Error('Product not found');
    }

    const wishlistResult = await getItem(tableName, { PK: `WISHLIST#${wishlistId}`, SK: `WISHLIST#${wishlistId}` });
    if (!wishlistResult.Item) {
        throw new Error('Wishlist not found');
    }
    if (wishlistResult.Item.createdBy !== userEmail && !wishlistResult.Item.invitedUsers.includes(userEmail)) {
        throw new Error('Unauthorized');
    }

    await deleteRecordFromTable({
        TableName: tableName,
        Key: { PK: `WISHLIST#${wishlistId}`, SK: `PRODUCT#${productId}` },
    });
};
