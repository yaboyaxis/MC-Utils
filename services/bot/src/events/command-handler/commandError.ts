import {
  CommandErrorPayload,
  Event,
  Events,
  PieceContext,
  UserError,
} from "@sapphire/framework";
import { Logger } from '@ayanaware/logger';

const log = Logger.get('Commands');

export default class CommandErrorEvent extends Event<Events.CommandError> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.CommandError,
    });
  }

  public run(error: any, { message, piece }: CommandErrorPayload) {
    if (!error.message) return message.channel.send(error);
    if (error instanceof UserError) return message.channel.send(error.message);
    log.error(`Error occured in the ${piece.name} command: ${error}`);
  }
}
