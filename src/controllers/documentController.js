import { processDocument } from '../services/documentService.js';

export const processDocumentController = async (req, res, next) => {
  try {
    const file = req.file;
    const assetId = await processDocument(file);
    res.json({assetId});
  } catch (err) {
    next(err);
  }
};