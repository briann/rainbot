import * as GCPDatastore from "@google-cloud/datastore";

const DATASTORE_XOXA_KIND = "XoxaToken";

export interface IAuthedXoxaTokenEvent {
    token: string;
    teamId: string;
}

export class DataEventListener {
    constructor(private datastore: GCPDatastore) {}

    public onAuthedXoxaToken = async (event: IAuthedXoxaTokenEvent) => {
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
