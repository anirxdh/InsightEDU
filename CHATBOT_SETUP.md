# Chatbot Setup Guide

## Overview
The website now includes a chatbot with RAG (Retrieval Augmented Generation) functionality that can answer questions about the educational data. The chatbot is positioned at the bottom right of the website and uses LangChain, OpenAI embeddings, and Pinecone vector database.

## Features
- **Position**: Bottom right corner of the website
- **Chat Window**: Opens when clicked, shows "Hi! How can I help you?"
- **RAG System**: Uses vector search to find relevant educational data
- **Data Sources**: All 6 JSON data files (graduation, GPA, demographics, FRP, staff, attendance)
- **Privacy**: No user data storage, chat resets on page refresh
- **Close Button**: X button to close the chat window

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# OpenAI API Key for embeddings and chat model
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Pinecone API Key for vector database
VITE_PINECONE_API_KEY=your_pinecone_api_key_here

# Pinecone Environment (e.g., us-east-1-aws)
VITE_PINECONE_ENVIRONMENT=your_pinecone_environment_here
```

### 2. API Keys Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

#### Pinecone Setup
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new project
4. Create a new index:
   - Name: `edudata-index`
   - Dimensions: `1536` (for OpenAI embeddings)
   - Metric: `cosine`
5. Copy your API key and environment from the console
6. Add them to your `.env` file

### 3. Dependencies
The following packages are already installed:
- `langchain`
- `@langchain/openai`
- `@langchain/pinecone`
- `@langchain/community`
- `@pinecone-database/pinecone`

### 4. Data Processing
The RAG system processes all 6 JSON data files:
- `graduationOutcomes.json` (2018-19 to 2022-23)
- `final_agg_gpa.json` (2017 to 2021)
- `final_agg_demo.json` (2019-20 to 2023-24)
- `final_agg_frp.json` (2019-20 to 2023-24)
- `staff.json` (2019 to 2023)
- `chronicAbsenteeism.json` (2019-20 to 2023-24)

Each file is processed into searchable documents with metadata tags.

### 5. Usage
1. Click the chat icon in the bottom right corner
2. Type your question about the educational data
3. The chatbot will search through the data and provide relevant answers
4. Click the X button to close the chat

### 6. Demo Mode
If API keys are not provided, the chatbot will work in demo mode with mock responses. This allows you to test the UI and functionality without setting up the APIs.

## Example Questions
- "How does chronic absenteeism affect graduation rates?"
- "What are the GPA trends over the years?"
- "Show me demographic distribution by race"
- "What's the FRP eligibility rate?"
- "How many staff members have master's degrees?"
- "What's the attendance rate by grade level?"

## Technical Details
- **Vector Store**: Pinecone with OpenAI embeddings
- **Chunking**: 1000 characters with 200 character overlap
- **Search**: Top 3 most relevant documents
- **Response**: Context-aware answers based on retrieved data
- **Security**: No user data storage, API keys in environment variables

## Troubleshooting
1. **API Key Errors**: Check that your API keys are correctly set in the `.env` file
2. **Pinecone Index**: Ensure the index name is `edudata-index` and dimensions are 1536
3. **Network Issues**: Check your internet connection for API calls
4. **Demo Mode**: If APIs fail, the chatbot will fall back to demo responses

## Files Modified
- `src/components/Chatbot.jsx` - Main chatbot component
- `src/utils/ragSystem.js` - RAG functionality and data processing
- `src/App.jsx` - Added chatbot to main app
- `package.json` - Added LangChain dependencies
