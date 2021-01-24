import { Event, Events, PieceContext } from "@sapphire/framework";
import { Logger } from "@ayanaware/logger";

const log = Logger.get("Client");

export default class WarnEvent extends Event<Events.Warn> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.Warn,
    });
  }

  public run(warning: any) {
    log.warn(warning);
  }
}
