import { OpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

export const model = new OpenAI({
  model: "gpt-3.5-turbo-instruct",
  temperature: 0.3,
  apiKey: process.env.OPENAI_API_KEY,
  streaming: true,
});

export const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-large",
});