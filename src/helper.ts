import type { ZodError } from "zod";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import moment from "moment";

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
