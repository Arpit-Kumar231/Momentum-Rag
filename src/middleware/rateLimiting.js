const rateLimiter = {
    requests: {},
    resetTime: 60000, // 1 minute in milliseconds
    limit: 20, // 20 requests per minute
  
    isRateLimited: function(ip) {
      const now = Date.now();
      if (!this.requests[ip]) {
        this.requests[ip] = { count: 1, startTime: now };
        return false;
      }
  
      if (now - this.requests[ip].startTime > this.resetTime) {
        this.requests[ip] = { count: 1, startTime: now };
        return false;
      }
  
      if (this.requests[ip].count >= this.limit) {
        return true;
      }
  
      this.requests[ip].count++;
      return false;
    }
  };
  export const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip;
    console.log()
    if (rateLimiter.isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many requests, please try again later." });
    }
    next();
  };