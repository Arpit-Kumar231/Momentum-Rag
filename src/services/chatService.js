import { v4 as uuidv4 } from "uuid";
import { db } from '../config/database.js';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { pineconeIndex } from '../config/pinecone.js';
import { embeddings, model } from '../config/openai.js';
import { PineconeStore } from "@langchain/pinecone";
import logger from '../utils/logger.js';

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
  namespace: "ns1",
});

export const startChat = async (assetId) => {
  const chatThreadId = uuidv4();
  try {
    await setDoc(doc(db, "chatSessions", chatThreadId), {
      assetId,
      history: [],
    });
    return chatThreadId;
  } catch (error) {
    logger.error("Error starting chat session:", error);
    throw error;
  }
};

export const sendMessage = async (res, chatThreadId, query) => {
  try {
    const sessionDoc = await getDoc(doc(db, "chatSessions", chatThreadId));
    if (!sessionDoc.exists()) {
      throw new Error("Chat session not found");
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

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const stream = await model.stream(prompt);
    let fullResponse = "";

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
    throw error;
  }
};

export const getChatHistory = async (chatThreadId) => {
  try {
    const docRef = doc(db, 'chatSessions', chatThreadId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const data = docSnap.data();
    if (!data.history) {
      throw new Error('History field not found in document');
    }

    return data.history;
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    throw error;
  }
};