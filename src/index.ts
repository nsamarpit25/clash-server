import express, { Application, Request, Response } from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import Routes from "./routes/index.js";
import fileUpload from "express-fileupload";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(appLimiter);

app.use(
   fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
   })
);
app.use(express.static("public"));

// set view engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));

app.use(Routes);

app.get("/", async (req: Request, res: Response) => {
   // const html = await ejs.renderFile(
   //    path.resolve(__dirname, "./views/emails/welcome.ejs"),
   //    { name: "John Doe" }
   // );
   // sendEmail("sofev67022@eluxeer.com", "Testing SMTP", html);
   // await emailQueue.add(emailQueueName, {
   //    to: "sofev67022@eluxeer.com",
   //    subject: "Welcome",
   //    body: html,
   // });
   res.json({ message: "Email sent" });
});

import "./jobs/index.js";
import { emailQueue, emailQueueName } from "./jobs/EmailJob.js";
import { appLimiter } from "./config/rateLimit.js";

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
