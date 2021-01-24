import { Piece, SapphireClient, SapphireClientOptions } from "@sapphire/framework";
import { Store } from "@sapphire/pieces";
import { ClientOptions } from "discord.js";
import Database from "./database/Database";
import Util from "../util/Util";
import { Logger } from "@ayanaware/logger";
import "../util/Logger";

const log = Logger.get("Client");

Store.defaultStrategy.onLoad = (store: Store<any>, piece: Piece) => Logger.get(store.name).debug(`Loaded ${piece.name}.`);
Store.defaultStrategy.onLoadAll = (store: Store<any>) => Logger.get(store.name).info(`Loaded a total of ${store.size} ${store.name}.`);

export default class Client extends SapphireClient {
  public readonly util: Util = new Util(this);
  public readonly db: Database = new Database();

  constructor(options?: SapphireClientOptions & ClientOptions) {
    super(options);
  }

  public async login(token: string) {
    log.debug("Connecting to DB...");
    await this.db.init();
    log.info("Connected to DB.");

    return super.login(token);
  }
}
