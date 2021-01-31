import { Piece } from "@sapphire/pieces";
import Database from "../lib/database/Database";
import CustomCommand from "../lib/structures/Command";
import ClientUtil from "../util/Util";

declare module "@sapphire/framework" {
  interface ArgType {
    command: CustomCommand;
  }

  interface Command {
    usage: string;
  }
}

declare module "@sapphire/pieces" {
  interface Store<T extends Piece> {
    categories: string[];
  }

  interface Piece {
    category: string;
  }
}

declare module "discord.js" {
  interface Client {
    readonly util: ClientUtil;
    readonly db: Database;
  }
}