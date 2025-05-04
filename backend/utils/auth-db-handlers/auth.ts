import { getItem, saveItem } from '../aws-lib/ddb-utils';

export const getUser = async (tableName: string, email: string) => {
    const result = await getItem(tableName, { PK: `USER#${email}`, SK: 'PROFILE' });
    return result.Item;
};

export const createUser = async (tableName: string, email: string, password: string) => {
    // Check if user exists to prevent overwrites
    const existingUser = await getItem(tableName, { PK: `USER#${email}`, SK: 'PROFILE' });
    if (existingUser.Item) {
        throw new Error('User already exists');
    }

    await saveItem(tableName, {
        PK: `USER#${email}`,
        SK: 'PROFILE',
        GSI1PK: `USER#${email}`,
        GSI1SK: 'PROFILE',
        email,
        password,
        createdAt: new Date().toISOString(),
    });
};
