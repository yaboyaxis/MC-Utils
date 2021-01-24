import { Event, Events, PieceContext } from "@sapphire/framework";
import { Logger } from '@ayanaware/logger';

const log = Logger.get('Client');

export default class ErrorEvent extends Event<Events.Error> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.Error,
    });
  }

  public run(error: any) {
    log.error(error);
  }
}
