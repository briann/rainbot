import * as Datastore from "@google-cloud/datastore";
import ISecret from "./secret";
import ISecretStore from "./secretStore";

export class DatastoreSecretStore implements ISecretStore {

    // TODO: Add eviction.
    private secretCache: Map<string, string> = new Map<string, string>();

    constructor(private datastoreClient: Datastore) { }

    public async getSecret(secretName: string) {
        if (secretName == "") {
            throw new Error("No secret specified.");
        }
        if (this.secretCache.has(secretName)) {
            return this.secretCache.get(secretName);
        }

        const key = this.datastoreClient.key(["Secret", secretName]);
        const dataFetch = await this.datastoreClient.get(key);
        const result = dataFetch[0];
        if (result === undefined) {
            throw new Error("No secret found.");
        }
        const secretValue = (result as ISecret).secret;
        this.secretCache.set(secretName, secretValue);
        return secretValue;
    }
}