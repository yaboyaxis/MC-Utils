import Database from "../lib/database/Database";
import ClientUtil from "../util/Util";

declare module "discord.js" {
  interface Client {
    readonly util: ClientUtil;
    readonly db: Database;
  }
}