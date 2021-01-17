import chalk from "chalk";

export default class Logger {
  static _forcePadding(number: number) {
    return (number < 10 ? "0" : "") + number;
  }

  static _getCurrentTime() {
    const now = new Date();
    const day = this._forcePadding(now.getDate());
    const month = this._forcePadding(now.getMonth() + 1);
    const year = this._forcePadding(now.getFullYear());
    const hour = this._forcePadding(now.getHours());
    const minute = this._forcePadding(now.getMinutes());
    const second = this._forcePadding(now.getSeconds());

    return `${day}.${month}.${year} ${hour}:${minute}:${second}`;
  }

  static success(title: string, body: string) {
    console.log(
      chalk.green(`[ ${this._getCurrentTime()} ] [ ${title} ] `) + body
    );
  }

  static warning(title: string, body: string) {
    console.log(
      chalk.magenta(`[ ${this._getCurrentTime()} ] [ ${title} ] `) + body
    );
  }

  static error(title: string, body: string) {
    console.log(
      chalk.red(`[ ${this._getCurrentTime()} ] [ ${title} ] `) + body
    );
  }

  static debug(title: string, body: string) {
    console.log(
      chalk.magenta(`[ ${this._getCurrentTime()} ] [ ${title} ] `) + body
    );
  }

  static event(body: string) {
    console.log(
      chalk.cyanBright(`[ ${this._getCurrentTime()} ] [ EVENT ] `) + body
    );
  }
}
