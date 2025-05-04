import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandOutput,
    PutCommand,
    PutCommandOutput,
    UpdateCommand,
    QueryCommand,
    BatchWriteCommand,
    BatchWriteCommandInput,
    BatchWriteCommandOutput,
    DeleteCommand,
    DeleteCommandInput,
    DeleteCommandOutput,
    ScanCommand,
    ScanCommandInput,
    ScanCommandOutput,
    TransactWriteCommand,
    TransactWriteCommandInput,
    TransactWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

type AllowedItems = {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
    email?: string;
    password?: string;
    createdAt?: string;
    wishlistName?: string;
    createdBy?: string;
    invitedUsers?: string[];
    updatedAt?: string;
    productName?: string;
    imageUrl?: string;
    price?: number;
    addedBy?: string;
    connectionId?: string;
    userEmail?: string;
    wishlistId?: string;
};

export const saveItem = async <T extends AllowedItems>(tableName: string, item: T): Promise<PutCommandOutput> => {
    return docClient.send(new PutCommand({ TableName: tableName, Item: item }));
};

export const getItem = async (tableName: string, key: { PK: string; SK: string }): Promise<GetCommandOutput> => {
    try {
        return docClient.send(
            new GetCommand({
                TableName: tableName,
                Key: key,
            }),
        );
    } catch (error) {
        console.error('Error fetching item from DynamoDB:', error);
        throw error;
    }
};

export const updateItem = async (params: {
    tableName: string;
    key: { PK: string; SK: string };
    updateExpression: string;
    expressionAttributeValues: Record<string, any>;
    expressionAttributeNames?: Record<string, string>;
}) => {
    const { tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames } = params;

    return docClient.send(
        new UpdateCommand({
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
        }),
    );
};

export const queryItems = async (options: {
    tableName: string;
    indexName?: string;
    keyConditionExpression: string;
    expressionAttributeValues: { [key: string]: any };
    expressionAttributeNames?: { [key: string]: string };
    filterExpression?: string;
    limit?: number;
    exclusiveStartKey?: any;
}) => {
    const {
        tableName,
        indexName,
        keyConditionExpression,
        expressionAttributeValues,
        expressionAttributeNames,
        filterExpression,
        limit,
        exclusiveStartKey,
    } = options;

    const command = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        FilterExpression: filterExpression,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
    });

    const result = await docClient.send(command);
    return {
        items: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
    };
};

export const addRecordToTableBatch = async (params: BatchWriteCommandInput): Promise<BatchWriteCommandOutput> => {
    console.log('Batch Write Input -->', JSON.stringify({ params }, null));
    const command = new BatchWriteCommand(params);
    return docClient.send(command);
};

export const deleteRecordFromTable = async (params: DeleteCommandInput): Promise<DeleteCommandOutput> => {
    console.log('Delete Input -->', JSON.stringify({ params }, null));
    const command = new DeleteCommand(params);
    return docClient.send(command);
};

export const scanTable = (params: ScanCommandInput): Promise<ScanCommandOutput> => {
    console.log('scanItem -->', params);
    const command = new ScanCommand(params);
    return docClient.send(command);
};

export const TransactRecordsInTable = async (
    params: TransactWriteCommandInput,
): Promise<TransactWriteCommandOutput> => {
    console.log('transactWrite records -->', JSON.stringify(params));
    const command = new TransactWriteCommand(params);
    return docClient.send(command);
};
