import express from 'express';
import { processDocumentController } from '../controllers/documentController.js';
import { upload } from '../middleware/upload.js';
import { rateLimitMiddleware } from '../middleware/rateLimiting.js';

const router = express.Router();

router.post('/process', upload.single('file'),rateLimitMiddleware, processDocumentController);

export default router;