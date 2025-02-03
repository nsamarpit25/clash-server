interface AuthUser {
   id: number;
   email: string;
   name: string;
}

declare namespace Express {
   export interface Request {
      user?: AuthUser;
   }
}
