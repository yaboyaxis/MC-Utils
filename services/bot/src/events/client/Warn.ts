import { Event, Events, PieceContext } from '@sapphire/framework';

export default class WarnEvent extends Event<Events.Warn> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.Warn
    });
  }

  public run(w) {
    console.log(w);
  }  
}