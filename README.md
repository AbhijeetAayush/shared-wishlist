# Collaborative Product Wishlist App - Backend

![AWS SAM](https://img.shields.io/badge/AWS-SAM-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue) ![DynamoDB](https://img.shields.io/badge/DynamoDB-Single%20Table-green)

The **Collaborative Product Wishlist App** backend is a fully deployed, serverless application on AWS, powering user authentication, wishlist management, and collaborative product tracking. Built with **AWS Serverless Application Model (SAM)**, **TypeScript**, and **Amazon DynamoDB** using a **single-table design** with **Global Secondary Indexes (GSIs)**, it ensures efficient querying and minimized Read Capacity Units (RCUs). The frontend is partially complete, with some features integrated, and development continues to fully connect it with the backend.

## Table of Contents
- [Backend Features](#backend-features)
- [Architecture Overview](#architecture-overview)
- [Base URLs](#base-urls)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [DynamoDB Single-Table Design](#dynamodb-single-table-design)
- [CORS Support](#cors-support)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Backend Features
- **User Authentication**: Secure registration and login with JWTs, stored in DynamoDB.
- **Wishlist Management**: Create, update, delete, and list wishlists with efficient DynamoDB queries.
- **Collaboration**: Invite users to collaborate on wishlists, managed in DynamoDB.
- **Product Management**: Add, update, and remove products (name, price, image URL) in wishlists.
- **Serverless Scalability**: AWS SAM, API Gateway, and Lambda for auto-scaling and cost efficiency.
- **Type Safety**: TypeScript for robust, maintainable Lambda functions.
- **Optimized Data Access**: Single-table DynamoDB with GSIs for low-RCU, high-performance queries.

## Architecture Overview
The backend is a serverless application on AWS, optimized for scalability, low latency, and cost efficiency:
- **AWS API Gateway**: Routes HTTP and WebSocket requests to Lambda functions.
- **AWS Lambda**: Executes TypeScript-based logic for authentication, wishlists, and products.
- **Amazon DynamoDB**: Stores all data in a single table with primary keys (PK, SK) and a GSI (GSI1PK, GSI1SK) for efficient queries.
- **AWS SAM**: Defines and deploys infrastructure as code (API Gateway, Lambda, DynamoDB, IAM roles).
- **IAM Roles**: Enforces least-privilege access.

Infrastructure is provisioned via AWS CloudFormation using SAM templates.

## Base URLs
The deployed APIs are accessible at:
- **REST API**: `https://1w92ax2f8i.execute-api.us-east-1.amazonaws.com/Prod`
- **WebSocket**: `wss://4x69i1fjfe.execute-api.us-east-1.amazonaws.com/Prod`

All REST endpoints are prefixed with the REST API base URL.

## Tech Stack
- **AWS SAM**: Infrastructure as code for serverless deployment.
- **TypeScript**: Type-safe Lambda functions.
- **Amazon DynamoDB**: Single-table design with GSIs for efficient queries.
- **AWS API Gateway**: HTTP and WebSocket API management.
- **AWS Lambda**: Serverless compute for business logic.
- **AWS CloudFormation**: Infrastructure provisioning via SAM.
- **OpenAPI 3.0.3**: REST API specification.

## Getting Started
The backend is fully deployed, and APIs are operational. To interact:

1. **Access APIs**:
   - Use the REST API base URL: `https://1w92ax2f8i.execute-api.us-east-1.amazonaws.com/Prod`.
   - Test with Postman, cURL, or similar tools.

2. **Authentication**:
   - Register via `/auth/signup` to store credentials in DynamoDB.
   - Log in via `/auth/login` to get a JWT.
   - Use `Authorization: Bearer <token>` for protected endpoints.

3. **DynamoDB Interaction**:
   - All operations use a single DynamoDB table with GSIs.
   - Use APIs to manage data; direct DynamoDB access requires AWS credentials.

4. **Local Development**:
   - Clone the repository: `git clone <repo-url>`.
   - Install dependencies: `npm install`.
   - Test Lambda functions: `sam local invoke`.
   - Simulate API Gateway: `sam local start-api`.
   - Deploy updates: `sam deploy` with AWS credentials.

## API Endpoints
REST endpoints (prefixed with `https://1w92ax2f8i.execute-api.us-east-1.amazonaws.com/Prod`) are backed by TypeScript Lambda functions and DynamoDB.

### Authentication
- **`POST /auth/signup`**
  - Register a new user, storing credentials in DynamoDB.
  - **Body**: `{ "email": "user@example.com", "password": "password123" }`
  - **Responses**:
    - `200`: User created.
    - `400`: Invalid/missing fields.
    - `409`: User exists.
    - `500`: Server error.

- **`POST /auth/login`**
  - Authenticate and return a JWT, validated against DynamoDB.
  - **Body**: `{ "email": "user@example.com", "password": "password123" }`
  - **Responses**:
    - `200`: Login successful, returns JWT.
    - `400`: Invalid/missing fields.
    - `401`: Invalid credentials.
    - `500`: Server error.

### Wishlist Management
- **`POST /wishlist`**
  - Create a wishlist (requires JWT), stored in DynamoDB.
  - **Body**: `{ "wishlistName": "My Wishlist" }`
  - **Responses**:
    - `201`: Wishlist created.
    - `400`: Invalid/missing fields.
    - `401`: Invalid JWT.
    - `500`: Server error.

- **`GET /wishlist`**
  - List wishlists (requires JWT), queried via GSI.
  - **Query Param**: `limit` (default: 10, range: 1-100)
  - **Responses**:
    - `200`: List of wishlists.
    - `400`: Invalid limit.
    - `401`: Invalid JWT.
    - `500`: Server error.

- **`PUT /wishlist/{wishlistId}`**
  - Update a wishlist (requires JWT), updated in DynamoDB.
  - **Path**: `wishlistId`
  - **Body**: `{ "wishlistName": "Updated Wishlist" }`
  - **Responses**:
    - `200`: Wishlist updated.
    - `400`: Invalid/missing fields.
    - `401`: Invalid JWT.
    - `404`: Wishlist not found/unauthorized.
    - `500`: Server error.

- **`DELETE /wishlist/{wishlistId}`**
  - Delete a wishlist (requires JWT), removed from DynamoDB.
  - **Path**: `wishlistId`
  - **Responses**:
    - `200`: Wishlist deleted.
    - `400`: Missing wishlistId.
    - `401`: Invalid JWT.
    - `404`: Wishlist not found/unauthorized.
    - `500`: Server error.

- **`POST /wishlist/{wishlistId}/invite`**
  - Invite a user to a wishlist (requires JWT), updated in DynamoDB.
  - **Path**: `wishlistId`
  - **Body**: `{ "email": "friend@example.com" }`
  - **Responses**:
    - `200`: User invited.
    - `400`: Invalid/missing fields.
    - `401`: Invalid JWT.
    - `404`: Wishlist not found/unauthorized.
    - `500`: Server error.

### Product Management
- **`POST /wishlist/{wishlistId}/products`**
  - Add a product to a wishlist (requires JWT), stored in DynamoDB.
  - **Path**: `wishlistId`
  - **Body**: `{ "productName": "Laptop", "imageUrl": "https://example.com/laptop.jpg", "price": 999.99 }`
  - **Responses**:
    - `201`: Product added.
    - `400`: Invalid/missing fields.
    - `401`: Invalid JWT.
    - `403`: User not authorized.
    - `404`: Wishlist not found.
    - `500`: Server error.

- **`PUT /wishlist/{wishlistId}/products/{productId}`**
  - Update a product in a wishlist (requires JWT), updated in DynamoDB.
  - **Path**: `wishlistId`, `productId`
  - **Body**: `{ "productName": "Updated Laptop", "imageUrl": "https://example.com/updated-laptop.jpg", "price": 1099.99 }`
  - **Responses**:
    - `200`: Product updated.
    - `400`: Invalid/missing fields.
    - `401`: Invalid JWT.
    - `403`: User not authorized.
    - `404`: Wishlist/product not found.
    - `500`: Server error.

- **`DELETE /wishlist/{wishlistId}/products/{productId}`**
  - Delete a product from a wishlist (requires JWT), removed from DynamoDB.
  - **Path**: `wishlistId`, `productId`
  - **Responses**:
    - `200`: Product deleted.
    - `400`: Missing wishlistId/productId.
    - `401`: Invalid JWT.
    - `403`: User not authorized.
    - `404`: Wishlist/product not found.
    - `500`: Server error.

## Authentication
Protected endpoints (`/wishlist/*`) use **JWT-based authentication**:
1. Register or log in via `/auth/signup` or `/auth/login`.
2. Include JWT in `Authorization: Bearer <token>`.
3. `401 Unauthorized` returned for missing/invalid JWT.

## DynamoDB Single-Table Design
A **single-table design** in DynamoDB stores users, wishlists, and products efficiently. A **Global Secondary Index (GSI)** optimizes queries, reducing RCUs.

### Table Structure
- **Primary Key**:
  - `PK`: Partition Key (e.g., `USER#user@example.com`, `WISHLIST#123e4567-e89b-12d3-a456-426614174000`).
  - `SK`: Sort Key (e.g., `USER#user@example.com`, `WISHLIST#123e4567-e89b-12d3-a456-426614174000`, `PRODUCT#456e7890-f12c-34d5-b678-901234567890`).
- **GSI1**:
  - `GSI1PK`: Partition Key (e.g., `USER#user@example.com`).
  - `GSI1SK`: Sort Key (e.g., `WISHLIST#123e4567-e89b-12d3-a456-426614174000`).
- **Attributes**:
  - Users: `email`, `password` (hashed).
  - Wishlists: `wishlistName`, `createdBy`, `invitedUsers`, `createdAt`, `updatedAt`.
  - Products: `productName`, `imageUrl`, `price`.

### Query Optimization
- **Single-table design**: Consolidates data, reducing complexity.
- **GSI**: Enables fast wishlist retrieval by user, minimizing RCUs.
- **Sparse indexing**: Only relevant items in GSI, optimizing reads.
- **Batch operations**: Batch writes reduce Write Capacity Units (WCUs).

## CORS Support
All endpoints include `OPTIONS` for **CORS**:
- **Methods**: Vary by endpoint (e.g., `POST,OPTIONS` for `/auth/signup`).
- **Headers**: `Content-Type,Authorization`.
- **Origin**: `*`.

Frontend must handle CORS preflight requests.

## Error Handling
Standardized error responses:
```json
{
  "message": "Invalid request"
}
