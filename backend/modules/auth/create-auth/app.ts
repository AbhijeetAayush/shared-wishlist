import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { getUser, createUser } from '../../../utils/auth-db-handlers/auth';
import { validateSignup, validateLogin } from '../routes/auth';

const TABLE_NAME = process.env.TABLE_NAME || 'WishlistAppTable';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const path = event.path;
        const body = event.body ? JSON.parse(event.body) : {};

        if (path === '/auth/signup') {
            // Validate signup request
            const { error } = validateSignup(body);
            if (error) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: error.details[0].message }),
                };
            }

            const { email, password } = body;

            // Create new user
            await createUser(TABLE_NAME, email, password);

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'User created successfully', email }),
            };
        }

        if (path === '/auth/login') {
            // Validate login request
            const { error } = validateLogin(body);
            if (error) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: error.details[0].message }),
                };
            }

            const { email, password } = body;

            // Get user and validate credentials
            const user = await getUser(TABLE_NAME, email);
            if (!user || user.password !== password) {
                return {
                    statusCode: 401,
                    headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                    body: JSON.stringify({ message: 'Invalid credentials' }),
                };
            }

            // Generate JWT
            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'Login successful', token }),
            };
        }

        return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Path not found' }),
        };
    } catch (error: any) {
        console.error('Error:', error);
        if (error.message === 'User already exists') {
            return {
                statusCode: 409,
                headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
                body: JSON.stringify({ message: 'User already exists' }),
            };
        }
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*' },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
