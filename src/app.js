import express from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

export default app;