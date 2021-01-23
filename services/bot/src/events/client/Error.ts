import { Event, Events, PieceContext } from '@sapphire/framework';

export default class ErrorEvent extends Event<Events.Error> {
  constructor(context: PieceContext) {
    super(context, {
      name: Events.Error
    });
  }

  public run(w) {
    console.error(w);
  }  
}