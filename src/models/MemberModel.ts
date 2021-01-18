import { ModelOptions, prop, Severity } from "@typegoose/typegoose";

export interface CaseInfo {
  caseID?: any;
  moderator?: string;
  moderatorId?: string;
  user?: string;
  date?: string;
  type?: string;
  reason?: string;
  time?: string;
}

export interface Mutes {
  muted: boolean;
  isPerm: boolean;
  endDate: number;
  case: any;
}

@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export default class MemberModel {
  @prop()
  id!: string;
  @prop()
  userId!: string;
  @prop()
  guildId!: string;
  @prop({ default: false })
  blacklisted!: boolean;
  @prop({ default: [] })
  sanctions!: Array<CaseInfo>;
  @prop({ default: { muted: false, endDate: null, case: null } })
  mute!: Mutes;
}
