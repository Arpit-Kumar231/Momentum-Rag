import express from 'express';
import { startChatController, sendMessageController, getChatHistoryController } from '../controllers/chatController.js';

const router = express.Router();

router.post('/start', startChatController);
router.post('/message', sendMessageController);
router.get('/history/:chatThreadId', getChatHistoryController);

export default router;