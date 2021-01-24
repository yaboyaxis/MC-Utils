import Logger from "@ayanaware/logger";
import { LOG_LEVEL } from "../BotConfig";
import LoggerFormatter from "./LogFormatter";

Logger.setFormatter(new LoggerFormatter());

Logger.getDefaultTransport().setLevel(LOG_LEVEL);