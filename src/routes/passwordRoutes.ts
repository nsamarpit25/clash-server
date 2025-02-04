import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import { authLimiter } from "../config/rateLimit.js";
import { formatError, renderEmailEjs } from "../helper.js";
import { ZodError } from "zod";
import { forgetPasswordSchema } from "../validations/passwordValidation.js";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";

const router = Router();

router.post("/forget-password", authLimiter, async (req, res) => {
   try {
      const body = req.body;
      const payload = forgetPasswordSchema.parse(body);

      // find user with email
      let user = await prisma.user.findUnique({
         where: {
            email: payload.email,
         },
      });

      if (!user || user === null) {
         res.status(422).json({
            errors: { email: "No user found with this email" },
         });
         return;
      }

      // generate token
      const salt = await bcrypt.genSalt(10);
      const token = await bcrypt.hash(uuid(), salt);
      await prisma.user.update({
         where: {
            email: payload.email,
         },
         data: {
            password_reset_token: token,
            token_sent_at: new Date().toISOString(),
         },
      });

      const url = `${process.env.CLIENT_URL}/reset-password?email=${payload.email}&token=${token}`;

      const html = renderEmailEjs("forget-password.ejs", {
         name: user.name,
         url,
      });

      // send email
      await emailQueue.add(emailQueueName, {
         to: payload.email,
         subject: "Reset Password",
         body: html,
      });

      res.json({ message: "Reset password link sent to your email" });
      return;
   } catch (error) {
      console.log(error);
      if (error instanceof ZodError) {
         const errors = formatError(error);
         res.status(422).json({ message: "Invalid Data", errors });
         return;
      } else {
         res.status(500).json({ message: "Something went wrong" });
      }
   }
});

export default router;
