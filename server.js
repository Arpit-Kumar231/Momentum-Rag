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
import { v4 as uuidv4 } from "uuid";

import { Document, MetadataMode, VectorStoreIndex } from "llamaindex";

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars

import dotenv from "dotenv";
dotenv.config();
const pinecone = new PineconeClient();
let chatSessions = {
  "f6c75576-7a7f-407f-b1cf-6333d9531bc3": {
    assetId: "f58a81d9-baed-40d0-852e-fc1ed8c10f58",
    history: [],
  },
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });
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
  try {
    const file = req.file;

    const path = `uploads/${file.filename}`;
    const loader = new PDFLoader(path);
    const assetId = uuidv4();

    const docs = await loader.load();
    const data = docs[0].pageContent;
    const docOutput = await splitter.splitText(data);
    const preparedDocs = docOutput.map((chunk) => ({
      pageContent: chunk,
      metadata: { assetId: assetId },
    }));

    await vectorStore.addDocuments(preparedDocs);
    res.send(assetId);
  } catch (err) {
    console.error("Error processing document:", err);
    res.status(500).json({ error: "Failed to process document" });
  }
});
app.post("/api/chat/start", async (req, res) => {
  const { assetId } = req.body;
  const chatThreadId = uuidv4();

  chatSessions[chatThreadId] = {
    assetId,
    history: [],
  };

  res.send({ chatThreadId });
});
app.post("/api/chat/message", async (req, res) => {
  const { chatThreadId, query } = req.body;
  const session = chatSessions[chatThreadId];

  if (!session) {
    return res.status(404).send({ error: "Chat session not found" });
  }

  const retriever = vectorStore.asRetriever({ k: 2 });

  const assetIdFilters = session.assetIds;
  const retrievedDocuments = await retriever.invoke(query, {
    filters: { asset_id: assetIdFilters },
  });
  console.log(retrievedDocuments, "retrieved");

  const agentResponse = await model.generate({
    prompt: retrievedDocuments.map((doc) => doc.pageContent).join("\n"),
  });

  session.history.push({ userMessage: query, agentResponse });

  res.send({ response: agentResponse });
});
app.get("/api/chat/history", async (req, res) => {
  const { chatThreadId } = req.query;
  const session = chatSessions[chatThreadId];

  if (!session) {
    return res.status(404).send({ error: "Chat session not found" });
  }

  res.send({ history: session.history });
});
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
