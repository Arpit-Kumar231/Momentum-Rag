const PORT = 8000;
import express from "express";
import cors from "cors";
import db from "./firebaseConfig";






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
