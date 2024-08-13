const PORT = 8000;
import express from "express";
import cors from "cors";
import db from "./firebaseConfig.js";
import fs from "node:fs/promises";

import {
  Document,
  MetadataMode,
  VectorStoreIndex,
} from "llamaindex";
import dotenv from "dotenv"
dotenv.config();






const app = express();

app.use(express.json());
// app.use(express.json({ limit: "20mb", extended: true }));
// app.use(
//   express.urlencoded({ limit: "20mb", extended: true, parameterLimit: 50000 })
// );
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*"); // Or specific origin
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.use(cors());
app.post("/api/documents/process", async (req, res) => {
  const {path} = req.body;
  const essay = await fs.readFile(path, "utf-8");
  const document = new Document({ text: essay, id_: path });
  const index = await VectorStoreIndex.fromDocuments([document]);
  const queryEngine = index.asQueryEngine();
  const { response, sourceNodes } = await queryEngine.query({
    query: "What did the author do in college?",
  });
  console.log(response.toString());
  if (sourceNodes) {
    sourceNodes.forEach((source, index) => {
      console.log(
        `\n${index}: Score: ${source.score} - ${source.node.getContent(MetadataMode.NONE).substring(0, 50)}...\n`,
      );
    });
  }
  res.send(sourceNodes)



  
});
app.post("/api/chat/start", async (req, res) => {

  
})
app.post(" /api/chat/message", async (req, res) => {

  
})
app.get("/api/chat/history", async (req, res) => {

  
})
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
