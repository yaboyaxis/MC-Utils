import {
  CommandErrorPayload,
  Event,
  Events,
  PieceContext,
  UserError,
} from "@sapphire/framework";

export default class CommandErrorEvent extends Event<Events.CommandError> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.CommandError,
    });
  }

  public run(error: any, { message, piece }: CommandErrorPayload) {
    if (!error.message) return message.channel.send(error.message);
    if (error instanceof UserError) return message.channel.send(error.message);
  }
}