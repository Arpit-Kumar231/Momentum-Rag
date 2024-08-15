import express from "express";
import cors from "cors";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import multer from "multer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { v4 as uuidv4 } from "uuid";
import { db, doc, setDoc, updateDoc, getDoc } from "./firebaseConfig.js";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const PORT = process.env.PORT || 8000;
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

const model = new OpenAI({
  model: "gpt-3.5-turbo-instruct",
  temperature: 0.3,
  apiKey: process.env.OPENAI_API_KEY,
  streaming: true,
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

//multer storage setup for file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors());

// Middleware for error handling
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

//This endpoint is used by passing in a file in the request body and then extracting text from it then converting into chunks then to text embeddings and stroing it in vector store
app.post("/api/documents/process", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    const path = `uploads/${file.filename}`;
    const loader = new PDFLoader(path);
    const assetId = uuidv4();

    const docs = await loader.load();
    const data = docs.map((doc) => doc.pageContent).join("\n");
    //spliting text into chunks
    const docOutput = await splitter.splitText(data);
    const preparedDocs = docOutput.map((chunk) => ({
      pageContent: chunk,
      metadata: { assetId: assetId },
    }));
    // adding to vector store while creating embeddings 
    await vectorStore.addDocuments(preparedDocs);
    res.send(assetId);
  } catch (err) {
    logger.error("Error processing document:", err);
    next(err);
  }
});
// endpoint to start a chatting thread , here pass the asset id we get from "/api/documents/process"
app.post("/api/chat/start", async (req, res, next) => {
  const { assetId } = req.body;
  const chatThreadId = uuidv4();

  try {
    await setDoc(doc(db, "chatSessions", chatThreadId), {
      assetId,
      history: [],
    });

    res.send({ chatThreadId });
  } catch (error) {
    logger.error("Error starting chat session:", error);
    next(error);
  }
});
//enpoint to retrive embeddings from vector store and use it as context + streaming included
app.post("/api/chat/message", async (req, res, next) => {
  const { chatThreadId, query } = req.body;

  try {
    const sessionDoc = await getDoc(doc(db, "chatSessions", chatThreadId));
    if (!sessionDoc.exists()) {
      return res.status(404).send({ error: "Chat session not found" });
    }
    const session = sessionDoc.data();

    const retriever = vectorStore.asRetriever({ k: 2 });
    const assetIdFilters = session.assetId;
    const retrievedDocuments = await retriever.invoke(query, {
      filters: { assetId: assetIdFilters },
    });
    logger.info(retrievedDocuments);

    const prompt = `Based on the following information, please answer the user's query: "${query}"
      Context:
        ${retrievedDocuments.map((doc) => doc.pageContent).join("\n")}
      Answer:`;
    //here setting headers for streaming
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const stream = await model.stream(prompt);
    let fullResponse = "";
    // adding chunks in a single variable for full final response
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    await updateDoc(doc(db, "chatSessions", chatThreadId), {
      history: [
        ...session.history,
        { userMessage: query, agentResponse: fullResponse },
      ],
    });
  } catch (error) {
    logger.error("Error streaming response:", error);
    next(error);
  }
});

app.get("/api/chat/history/:chatThreadId", async (req, res, next) => {
  const chatThreadId  = req.params.chatThreadId;

  try {
    const docRef = doc(db, 'chatSessions', chatThreadId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = docSnap.data();
    if (!data.history) {
      return res.status(404).json({ error: 'History field not found in document' });
    }

    res.json({ history: data.history });
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    next(error);
  }
});

app.listen(PORT, () => {
  logger.info(`Server listening on Port ${PORT}`);
});