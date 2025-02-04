import { Router, type Request, type Response } from "express";
import {
   deleteImage,
   formatError,
   imageValidator,
   uploadFile,
} from "../helper.js";
import { clashSchema } from "../validations/clashValidations.js";
import { ZodError } from "zod";
import type { UploadedFile } from "express-fileupload";
import { prisma } from "../config/database.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
   try {
      const clashes = await prisma.clash.findMany({
         where: {
            user_id: req.user?.id!,
         },
      });
      res.json({ data: clashes, message: "Clashes fetched successfully" });
      return;
   } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
   }
});
router.get("/:id", async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      const clashes = await prisma.clash.findUnique({
         where: {
            id: parseInt(id),
         },
      });
      res.json({ data: clashes, message: "Clashes fetched successfully" });
      return;
   } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
   }
});

router.post("/", async (req: Request, res: Response) => {
   try {
      const body = req.body;
      const payload = clashSchema.parse(body);

      // check if file exists
      if (req.files?.image) {
         const image = req.files.image as UploadedFile;
         const validationsMsg = imageValidator(image.size, image.mimetype);
         if (validationsMsg) {
            res.status(422).json({ errors: { image: validationsMsg } });
            return;
         }
         payload.image = await uploadFile(image);
      } else {
         res.status(422).json({ errors: { image: "Image is required" } });
         return;
      }

      await prisma.clash.create({
         data: {
            ...payload,
            image: payload.image!,
            expires_at: new Date(payload.expires_at),
            user_id: req.user?.id!,
         },
      });

      res.json({ message: "Clash created successfully" });
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

router.put("/:id", async (req: Request, res: Response) => {
   try {
      const { id } = req.params;
      const body = req.body;
      const payload = clashSchema.parse(body);

      // check if file exists
      if (req.files?.image) {
         const image = req.files.image as UploadedFile;
         const validationsMsg = imageValidator(image.size, image.mimetype);
         if (validationsMsg) {
            res.status(422).json({ errors: { image: validationsMsg } });
            return;
         }

         // get old image name
         const clash = await prisma.clash.findUnique({
            select: {
               id: true,
               image: true,
            },
            where: {
               id: parseInt(id),
            },
         });
         if (clash) deleteImage(clash?.image);
         payload.image = await uploadFile(image);
      }

      await prisma.clash.update({
         where: {
            id: parseInt(id),
         },
         data: {
            ...payload,
            expires_at: new Date(payload.expires_at),
         },
      });

      res.json({ message: "Clash updated successfully" });
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

router.delete("/:id", async (req: Request, res: Response) => {
   try {
      const clash = await prisma.clash.findUnique({
         select: {
            id: true,
            image: true,
         },
         where: {
            id: parseInt(req.params.id),
         },
      });
      if (clash) deleteImage(clash?.image);

      await prisma.clash.delete({
         where: {
            id: parseInt(req.params.id),
         },
      });

      res.json({ message: "Clashes deleted successfully" });
      return;
   } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
   }
});
export default router;
