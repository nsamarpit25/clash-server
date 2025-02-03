import {
   Router,
   type Request,
   type RequestHandler,
   type Response,
} from "express";
import { registerSchema } from "../validations/authValidations.js";
import { formatError, renderEmailEjs } from "../helper.js";
import { ZodError } from "zod";
import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";

const router = Router();

// * Register a new user
router.post("/register", async (req: Request, res: Response) => {
   try {
      const body = req.body;
      const payload = registerSchema.parse(body);

      let user = await prisma.user.findUnique({
         where: {
            email: payload.email,
         },
      });

      if (user) {
         res.status(422).json({ message: "User already exists" });
         return;
      }

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(payload.password, salt);
      const token = await bcrypt.hash(uuid(), 10);

      await prisma.user.create({
         data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            email_verify_token: token,
         },
      });

      const url = `${process.env.APP_URL}/verify-email?email=${payload.email}&token=${token}`;

      const emailBody = await renderEmailEjs("email-verify.ejs", {
         name: payload.name,
         url,
      });

      await emailQueue.add(emailQueueName, {
         to: payload.email,
         subject: "Verify Email",
         body: emailBody,
      });

      res.json({
         message:
            "Please check your email. We have sent you verification email!",
      });
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
