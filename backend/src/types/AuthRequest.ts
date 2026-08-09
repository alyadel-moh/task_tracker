// src/types/AuthRequest.ts
import { Request } from "express";

export interface AuthRequest<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}
