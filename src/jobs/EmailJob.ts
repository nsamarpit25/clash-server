import { Queue, Worker, type Job } from "bullmq";

import { redisConnection, defaultQueueOptions } from "../config/queue.js";
import { sendEmail } from "../config/mail.js";

export const emailQueueName = "emailQueue";

export const emailQueue = new Queue(emailQueueName, {
   connection: redisConnection,
   defaultJobOptions: defaultQueueOptions,
});

interface EmailJobDataType {
   to: string;
   body: string;
   subject: string;
}

export const queueWorker = new Worker(
   emailQueueName,
   async (job: Job) => {
      const data: EmailJobDataType = job.data;
      await sendEmail(data.to, data.subject, data.body);
      // console.log("The queue data is:", data);
   },
   {
      connection: redisConnection,
   }
);
