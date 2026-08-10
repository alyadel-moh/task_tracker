import morgan, { StreamOptions } from "morgan";
import { logger } from "../config/logger";

const stream: StreamOptions = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const httpLogger = morgan("dev", { stream });
