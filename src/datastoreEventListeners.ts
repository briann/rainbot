import * as GCPDatastore from "@google-cloud/datastore";

export const DATASTORE_XOXA_KIND = "XoxaToken";

export interface IAuthedXoxaToken {
    token: string;
    teamId: string;
}

export class DataEventListener {
    constructor(private datastore: GCPDatastore) {}

    public onAuthedXoxaToken = async (event: IAuthedXoxaToken) => {
        const key = this.datastore.key([DATASTORE_XOXA_KIND, event.teamId]);
        const data = {
            teamId: event.teamId,
            token: event.token,
        };
        await this.datastore.save({
            key,
            data,
        });
    }
}
