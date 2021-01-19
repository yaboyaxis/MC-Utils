import { DocumentType } from "@typegoose/typegoose";
import {
  AkairoClient,
  CommandHandler,
  ListenerHandler,
  InhibitorHandler,
} from "discord-akairo";
import { Message, Collection } from "discord.js";
import { join } from "path";
import config from "../config";
import MemberModel from "../models/MemberModel";
import { Automod } from "../structures/Automod";
import Logger from "../structures/Logger";
import Mongo from "../structures/Mongo";

let owners = config.bot.owners;
let prefix = config.bot.prefix;

declare module "discord-akairo" {
  interface AkairoClient {
    commandHandler: CommandHandler;
    listenerHandler: ListenerHandler;
    inhibitorHandler: InhibitorHandler;
    botConfig: typeof config;
    automod: Automod;
    databaseCache_mutedUsers: Collection<string, DocumentType<MemberModel>>;
    databaseCache: any;
  }
}

interface BotOptions {
  token?: string;
  owners?: string | string[];
}

export default class BotClient extends AkairoClient {
  public config: BotOptions;
  public botConfig: any;
  public static databaseCache: any = {};
  public databaseCache_mutedUsers = new Collection<
    string,
    DocumentType<MemberModel>
  >();
  public automod: Automod = new Automod(this, {
    muteEnabled: true,
    warnEnabled: true,
    maxInt: 2000,
    maxDupInt: 2000,
    maxDuplicatesWarn: 7,
    maxDuplicatesMute: 9,
    ignoredMembers: [],
    ignoredChannels: [],
    ignoredPermissions: [],
    ignoredRoles: [],
    ignoreBots: true,
    messageLengthLimit: 500,
    mentionLimit: 4,
    nWordFilter: true,
    soundPingFilter: true,
    messageSpamCount: 5,
    filterURLs: true,
  });
  public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
    directory: join(__dirname, "..", "inhibitors"),
  });
  public listenerHandler: ListenerHandler = new ListenerHandler(this, {
    directory: join(__dirname, "..", "listeners"),
  });
  public commandHandler: CommandHandler = new CommandHandler(this, {
    directory: join(__dirname, "..", "commands"),
    prefix: prefix,
    allowMention: true,
    handleEdits: true,
    commandUtil: true,
    commandUtilLifetime: 3e5,
    defaultCooldown: 6e4,
    argumentDefaults: {
      prompt: {
        modifyStart: (_: Message, str: string): string =>
          `${str}\nType \`cancel\` to cancel the command!`,
        modifyRetry: (_: Message, str: string): string =>
          `${str}\nType \`cancel\` to cancel the command!`,
        timeout: "You took too long, the command has been canceled!",
        ended:
          "You've exceeded the maximum amount of tries, this command has now been canceled!",
        cancel: "Command has been successfully canceled!",
        retries: 3,
        time: 3e4,
      },
      otherwise: "",
    },
    ignorePermissions: owners,
  });
  public constructor(config: BotOptions) {
    super(
      {
        ownerID: config.owners,
      },
      {
        ws: {
          intents: 14023,
        },
        http: {
          version: 8,
        },
      }
    );
    this.config = config;
  }
  private async _init(): Promise<void> {
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler,
      inhibitorHandler: this.inhibitorHandler,
    });
    this.commandHandler.loadAll();
    this.listenerHandler.loadAll();
    this.inhibitorHandler.loadAll();
    await Mongo()
      .then(() => Logger.success("DB", "Connected to MongoDB!"))
      .catch((e) => Logger.error("DB", e));
  }
  public async start(): Promise<string> {
    Logger.event("Starting the bot... please wait.");
    await this._init();
    return this.login(this.config.token);
  }
}
