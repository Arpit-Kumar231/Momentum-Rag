import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
};