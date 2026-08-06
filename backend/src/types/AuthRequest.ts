import { Request } from "express";

export interface AuthRequest<
  P = {},
  ResBody = {},
  ReqBody = {},
  ReqQuery = {},
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: {
    id: string;
  };
}
