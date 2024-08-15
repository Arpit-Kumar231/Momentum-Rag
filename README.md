# Document Processing and Chat API

This API provides endpoints for processing PDF documents, initiating chat sessions, sending messages, and retrieving chat history. It uses vector storage for efficient document querying and provides streaming responses for chat interactions.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Features

- Document processing and storage
- Chat sessions based on processed documents
- Streaming responses for chat messages
- Chat history retrieval
- Rate limiting


## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Pinecone account (for vector storage)
- OpenAI API key

## Installation

1. Clone the repository
2. npm i (to install dependencies)
3. geneate and add your own env variables according to .env.example
4. npm start to run the server


## API Endpoints

### 1. Process Document

Uploads and processes a any document, storing it in the vector database.

- **URL:** `/api/documents/process`
- **Method:** POST
- **Content-Type:** multipart/form-data

**Request Body:**
- `file`: The file to be processed (required)

**Response:**
- `200 OK`: Returns the generated assetId
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error occurred

### 2. Start Chat Session

Initiates a new chat session for a specific document.

- **URL:** `/api/chat/start`
- **Method:** POST
- **Content-Type:** application/json

**Request Body:**

{ "assetId": "string"}

**Response:**

**Response:**
- `200 OK`: Returns the chatThreadId
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error occurred

### Send Chat Message
Sends a message to the chat session and receives a streaming response.

URL: /api/chat/message
Method: POST
Content-Type: application/json
Request Body:


`
{
  "chatThreadId": "string",
  "query": "string"
}`

**Response:**

200 OK: Server-Sent Events stream
404 Not Found: Chat session not found
429 Too Many Requests: Rate limit exceeded
500 Internal Server Error: Server error occurred

### Get Chat History
Retrieves the chat history for a specific chat session.
- **URL:** `/api/chat/history`
- **Method:** GET
- **Query Pamameters:**  chatThreadId: The ID of the chat session (required)




Response:

200 OK: Returns the chat history
404 Not Found: Chat session not found
429 Too Many Requests: Rate limit exceeded
500 Internal Server Error: Server error occurred
Rate Limiting
The API implements a simple rate limiter allowing 10 requests per minute per IP address. Exceeding this limit will result in a 429 (Too Many Requests) error.
