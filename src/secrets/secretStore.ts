export default interface ISecretStore {
    getSecret(secretName: string): Promise<string>;
}