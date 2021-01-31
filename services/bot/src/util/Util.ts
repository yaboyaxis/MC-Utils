import req from "@helperdiscord/centra";
import Client from "../lib/Client";

export default class Util {
  constructor(public readonly client: Client) {}

  public async bin(body: any, ext = "js") {
    const res = await req("https://hst.sh/documents", "POST")
      .body(body)
      .timeout(15000)
      .send();

    if (res.statusCode === 200) {
      return `https://hst.sh/${res.json().key}.${ext}`;
    }
    return `Could not upload data to hst.sh, server returned statusCode ${res.statusCode}.`;
  }

  public toTitleCase(text: string) {
    return text.replace(/\b\w/g, (c: string) => c.toUpperCase())
  }
}
