import rateLimit from "express-rate-limit";

export const appLimiter = rateLimit({
   windowMs: 60 * 60 * 1000, // 1 hour window
   limit: 100, // start blocking after 100 requests
   message: "Too many requests from this IP, please try again after an hour",
   standardHeaders: "draft-7",
   legacyHeaders: false,
});

export const authLimiter = rateLimit({
   windowMs: 60 * 60 * 1000, // 1 hour window
   limit: 30, // start blocking after 30 requests
   message: "Too many requests from this IP, please try again after an hour",
   standardHeaders: "draft-7",
   legacyHeaders: false,
});
