import express from 'express';
import { processDocumentController } from '../controllers/documentController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/process', upload.single('file'), processDocumentController);

export default router;