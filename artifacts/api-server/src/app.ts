import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp = require("pino-http");
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: typeof req.url === "string" ? req.url.split("?")[0] : undefined,
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const corsOrigin = process.env.CORS_ORIGIN;
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !corsOrigin) {
  throw new Error("CORS_ORIGIN must be set in production. Example: CORS_ORIGIN=https://your-frontend.vercel.app");
}
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
