import bcrypt from "bcrypt";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { ZodError } from "zod";
import { prisma } from "../config/database.js";
import { authLimiter } from "../config/rateLimit.js";
import {
   checkDateHourDifference,
   formatError,
   renderEmailEjs,
} from "../helper.js";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import {
   forgetPasswordSchema,
   resetPasswordSchema,
} from "../validations/passwordValidation.js";

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

      const url = `${process.env.CLIENT_APP_URL}/reset-password?email=${payload.email}&token=${token}`;

      const html = await renderEmailEjs("forget-password.ejs", {
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

router.post("/reset-password", authLimiter, async (req, res) => {
   try {
      const body = req.body;
      const payload = resetPasswordSchema.parse(body);

      // find user with email
      const user = await prisma.user.findUnique({
         where: {
            email: payload.email,
         },
      });

      // check if user exists
      if (!user || user === null) {
         res.status(422).json({
            message: "Invalid link",
         });
         return;
      }

      // check if token is valid
      if (user.password_reset_token !== payload.token) {
         res.status(422).json({
            message: "Expired link",
            errors: { token: "Invalid token" },
         });
         return;
      }

      // check if token is expired
      const hourDifference = checkDateHourDifference(user.token_sent_at!);
      if (hourDifference > 2) {
         res.status(422).json({
            message: "Link expired!! Please generate a new link",
            errors: { email: "Token expired" },
         });
         return;
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(payload.password, salt);

      // update password
      await prisma.user.update({
         where: {
            email: payload.email,
         },
         data: {
            password: hashedPassword,
            password_reset_token: null,
            token_sent_at: null,
         },
      });

      res.json({ message: "Password updated successfully! You can login now" });

      // return
      return;

      //
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
