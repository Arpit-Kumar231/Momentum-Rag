import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';

dotenv.config();

export const pinecone = new PineconeClient();
export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);