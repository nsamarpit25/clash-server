import type { ZodError } from "zod";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import moment from "moment";
import { supportedMimes } from "./config/fileSystem.js";
import type { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
import { fstat, fsync } from "fs";
import fs from "fs";

export const formatError = (error: ZodError): any => {
   let errors: any = {};
   error.errors.map((issue) => {
      errors[issue.path[0]] = issue.message;
   });

   return errors;
};

export const renderEmailEjs = async (
   fileName: string,
   payload: any
): Promise<String> => {
   const __dirname = path.dirname(fileURLToPath(import.meta.url));

   const html: string = await ejs.renderFile(
      path.resolve(__dirname, `./views/emails/${fileName}`),
      payload
   );

   return html;
};

export const checkDateHourDifference = (date: Date | string): number => {
   const now = moment();
   const tokenSentAt = moment(date);
   const duration = moment.duration(now.diff(tokenSentAt));

   return duration.asHours();
};

export const imageValidator = (size: number, mime: string): string | null => {
   const sizeInMB = bytesToMB(size);
   if (sizeInMB > 2) {
      return "Image size must be less than 2MB";
   } else if (!supportedMimes.includes(mime)) {
      return "Image type is not supported";
   }
   return null;
};

export const bytesToMB = (bytes: number): number => {
   return bytes / (1024 * 1024);
};

export const uploadFile = async (image: UploadedFile) => {
   const imageExt = image.name.split(".");
   const imageName = uuidv4() + "." + imageExt[imageExt.length - 1];
   const uploadPath = process.cwd() + "/public/images/" + imageName;
   image.mv(uploadPath, (err) => {
      if (err) throw err;
   });
   return imageName;
};

export const deleteImage = async (fileName: string) => {
   const filePath = process.cwd() + "/public/images/" + fileName;
   if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
   }
};
