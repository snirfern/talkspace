import express from 'express';
import bodyParser from 'body-parser';
import {Logger} from './Utils/Logger'
import router from "./routes/routes";

const logger = new Logger('infra_db')

export const app = express();
const port = process.env.PORT || 3000;
let serverRetries: number = Number(process.env.RETRIES);

app.use(bodyParser.json());

// @ts-ignore
app.use("/api/", router);

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    server.on('error', error => {
        logger.error('Error starting server:', `message: ${error.message}`);
        if (serverRetries === 0) {
            logger.error('server init  final failure', `Final error for initiating server:${error.message}`)
            process.exit(0);
        }
        serverRetries--;
        setTimeout(() => {
            logger.log('Attempting to restart server...');
            startServer(port);
        }, 5000);
    });
}

startServer(port)
