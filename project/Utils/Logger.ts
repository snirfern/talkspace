export class Logger {
    private db: string;

    constructor(dbName) {
        this.db = dbName;
    }

    log(message: string) {
        console.log(`id: ${new Date().valueOf} , message: ${message}`)
        // log on to db
    }

    error(title: string, error: string) {
        console.log(`id: ${new Date().valueOf} ,title: ${title}, message: ${error}`)
        // log on to db

    }
}

