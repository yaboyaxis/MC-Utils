import {
  Event,
  EventErrorPayload,
  Events,
  PieceContext,
} from "@sapphire/framework";
import { Logger } from "@ayanaware/logger";

const log = Logger.get("Events");

export default class CommandErrorEvent extends Event<Events.EventError> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.CommandError,
    });
  }

  public run(error: any, { piece }: EventErrorPayload) {
    log.error(`Error occured in the ${piece.name} event: ${error}`);
  }
}
