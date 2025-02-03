import {
   Router,
   type Request,
   type RequestHandler,
   type Response,
} from "express";
import { registerSchema } from "../validations/authValidations.js";
import { formatError } from "../helper.js";
import { ZodError } from "zod";
import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

const router = Router();

// * Register a new user
router.post("/register", async (req: Request, res: Response) => {
   try {
      const body = req.body;
      console.log(req.body);
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

      await prisma.user.create({
         data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
         },
      });

      res.json({ message: "Account created successfully" });
      return;
   } catch (error) {
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
