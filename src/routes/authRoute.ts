import {
   Router,
   type Request,
   type RequestHandler,
   type Response,
} from "express";
import { loginSchema, registerSchema } from "../validations/authValidations.js";
import { formatError, renderEmailEjs } from "../helper.js";
import { ZodError } from "zod";
import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/AuthMiddlewares.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
   try {
      const body = req.body;

      const payload = loginSchema.parse(body);
      console.log(payload);
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

      const compare = await bcrypt.compare(payload.password, user.password);
      if (!compare) {
         res.status(422).json({
            errors: { password: "Invalid Credentials" },
         });
         return;
      }
      // JWT Payload
      const jwtPayload = {
         id: user.id,
         name: user.name,
         email: user.email,
      };
      const token = jwt.sign(jwtPayload, process.env.SECRET_KEY!, {
         expiresIn: "100d",
      });

      res.json({
         message: "Login Successful",
         token,
         data: {
            ...jwtPayload,
            token: `Bearer ${token}`,
         },
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

// * Get user route

router.get("/user", authMiddleware, async (req: Request, res: Response) => {
   const user = req.user;
   res.json({ user });
   return;
});

export default router;
