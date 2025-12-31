import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type ValidateOptions<TBody, TQuery, TParams> = {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
};

export const validate = <TBody = unknown, TQuery = unknown, TParams = unknown>(
  schemas: ValidateOptions<TBody, TQuery, TParams>
): RequestHandler<TParams, unknown, TBody, TQuery> => {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  };
};
