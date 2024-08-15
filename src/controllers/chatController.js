import { startChat, sendMessage, getChatHistory } from '../services/chatService.js';

export const startChatController = async (req, res, next) => {
  try {
    const { assetId } = req.body;
    const chatThreadId = await startChat(assetId);
    res.send({ chatThreadId });
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (req, res, next) => {
  try {
    const { chatThreadId, query } = req.body;
    await sendMessage(res, chatThreadId, query);
  } catch (error) {
    next(error);
  }
};

export const getChatHistoryController = async (req, res, next) => {
  try {
    const { chatThreadId } = req.params;
    const history = await getChatHistory(chatThreadId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};