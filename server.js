const PORT = 8000;
import express from "express";
import cors from "cors";
import db from "./firebaseConfig.js";
import fs from "node:fs/promises";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import multer from "multer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";

import { Document, MetadataMode, VectorStoreIndex } from "llamaindex";

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars

import dotenv from "dotenv";
dotenv.config();
const pinecone = new PineconeClient();
// let chatSessions = {};
const upload = multer({ dest: "uploads/" });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);


const model = new OpenAI({
  model: "gpt-3.5-turbo-instruct",
  temperature: 0.3,
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-large",
});
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
  namespace: "ns1",
});
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 50,
});

const app = express();

app.use(express.json());

app.use(cors());
app.post("/api/documents/process", upload.single("file"), async (req, res) => {
  console.log(req.body,"body")
  console.log(req.file,"file")
  const { file } = req.file;
  

  const path = `uploads/Arpit.pdf`;
  const loader = new PDFLoader(path);

  const docs = await loader.load();
  const data = docs[0].pageContent;
  console.log(data +"data")
  const docOutput = await splitter.createDocuments([data]);
  const assetId = await vectorStore.addDocuments(docOutput);
  res.send(assetId);
});
app.post("/api/chat/start", async (req, res) => {

});
app.post("/api/chat/message", async (req, res) => {
  const { query } = req.body;
  const retriever = vectorstore.asRetriever(4);
  const retrievedDocuments = await retriever.invoke(query);
  retrievedDocuments[0].pageContent;
});
app.get("/api/chat/history", async (req, res) => {});
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
