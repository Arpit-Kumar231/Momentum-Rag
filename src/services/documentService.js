import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";

import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { v4 as uuidv4 } from "uuid";
import { pineconeIndex } from "../config/pinecone.js";
import { embeddings } from "../config/openai.js";
import logger from "../utils/logger.js";
const getLoaderForFile = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase()
  switch (`.${extension}`) {
    case ".pdf":
      return new PDFLoader(filePath);
    case ".csv":
      return new CSVLoader(filePath);
    case ".docx":
      return new DocxLoader(filePath);
    case ".txt":
      return new TextLoader(filePath);

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
  namespace: "ns1",
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 50,
});

export const processDocument = async (file) => {
  try {
    const path = `uploads/${file.filename}`;
    
    const loader = getLoaderForFile(path);
    const assetId = uuidv4();

    const docs = await loader.load();
    const data = docs.map((doc) => doc.pageContent).join("\n");

    const docOutput = await splitter.splitText(data);
    const preparedDocs = docOutput.map((chunk) => ({
      pageContent: chunk,
      metadata: { assetId: assetId },
    }));

    await vectorStore.addDocuments(preparedDocs);
    return assetId;
  } catch (err) {
    logger.error("Error processing document:", err);
    throw err;
  }
};
