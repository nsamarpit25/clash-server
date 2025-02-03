import { Router, type Request, type Response } from "express";
import { prisma } from "../config/database.js";

const router = Router();

router.get("/verify-email", async (req: Request, res: Response) => {
   // get email and token from query params
   const { email, token } = req.query;

   // if email or token is missing, return error redirect to verify-error page
   if (!email || !token) {
      res.status(400).json({ message: "Invalid verification link" });
      return res.redirect("/verify-error");
   }

   // get user by email
   const user = await prisma.user.findUnique({
      where: { email: email as string },
   });

   // if user not found, return error redirect to verify-error page
   if (!user) {
      res.status(404).json({ message: "User not found" });
      return res.redirect("/verify-error");
   }

   // if token is not equal to user email_verify_token, return error redirect to verify-error page
   if (token === user.email_verify_token) {
      await prisma.user.update({
         where: { email: email as string },
         data: {
            email_verify_token: null,
            email_verified_at: new Date().toISOString(),
         },
      });

      return res.redirect(`${process.env.CLIENT_APP_URL}/login`);
   }

   // redirect to error page if token does not match
   res.redirect("/verify-error");
});

router.get("/verify-error", (req: Request, res: Response) => {
   return res.render("auth/emailVerifyError");
});
export default router;
