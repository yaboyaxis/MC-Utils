import { Formatter, LogMeta, LogLevel } from "@ayanaware/logger";
import { yellowBright, redBright, blue, white, magenta, yellow, greenBright } from "colorette";
import { format } from "fecha";

export default class LogFormatter extends Formatter {
  public formatMessage(meta: LogMeta, message: string) {
    return `${this.formatTimestamp()} ${this.formatColor(meta.level)}: ${this.formatName(meta.origin.name)} ${message}`;
  }

  public formatError(meta: LogMeta, error: Error) {
    return error.toString();
  }

  public formatColor(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return yellowBright("debug");
      case LogLevel.ERROR:
        return redBright("error");
      case LogLevel.INFO:
        return blue("info");
      case LogLevel.OFF:
        return white("off");
      case LogLevel.TRACE:
        return magenta("trace");
      case LogLevel.WARN:
        return yellow("warn");
      default: 
        return greenBright(level);
    }
  }

  public formatName(name: string): string {
    return `[${greenBright(name.replace(/(\b\w)/gi, (c: string) => c.toUpperCase()))}]`;
  }

  public formatTimestamp(): string {
    return format(new Date(), "YYYY-MM-DD hh:mm:ss A");
  }
}