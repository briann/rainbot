/**
 * This type of error should return a 200 to keep Slack happy, but should get
 * logged in the error handling middelware on our end.
 */
export default class SlackError extends Error {
    constructor(message: string, public status: number = 200) {
        super(message);
    }
}