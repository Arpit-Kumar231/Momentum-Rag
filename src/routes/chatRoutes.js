import express from 'express';
import { startChatController, sendMessageController, getChatHistoryController } from '../controllers/chatController.js';
import { rateLimitMiddleware } from '../middleware/rateLimiting.js';

const router = express.Router();

router.post('/start',rateLimitMiddleware, startChatController);
router.post('/message',rateLimitMiddleware, sendMessageController);
router.get('/history/:chatThreadId',rateLimitMiddleware, getChatHistoryController);

export default router;