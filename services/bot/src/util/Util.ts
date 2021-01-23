import Client from "../lib/Client";
import req from "@helperdiscord/centra";

export default class Util {
  constructor(public readonly client: Client) {}

  public async bin(body: any, ext = "js") {
    const res = await req("https://hst.sh/documents")
      .body(body)
      .timeout(15000)
      .send();

    if (res.statusCode === 200) {
      return `https://hst.sh/${res.json().key}.${ext}`;
    }
    return `Could not upload data to hst.sh, server returned statusCode ${res.statusCode}.`;
  }
}
