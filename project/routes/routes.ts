import BookingsController from "../Controllers/Bookings/BookingsController";
import paths from "./paths";

const express = require("express");

type Callback<T extends any[]> = (...args: T) => void;

interface Path {
    path: string;
    method: string;
    handler: Callback<any>;
    middleware: Callback<any>;
}


class Router {
    private readonly router: Router;

    constructor(paths, controller) {
        this.router = express.Router()
        this.applyRoutes(paths, controller)
    }

    applyRoutes(paths: (string) => Path[], controller: string) {

        paths(controller).forEach((route: Path) => {
            const {path, method, handler, middleware} = route;
            if (middleware) {
                this.router[method](`/${path}`, middleware, handler);
            } else {
                this.router[method](`/${path}`, handler);
            }
        });
    }

    getRouter() {
        return this.router
    }
}

const router = new Router(paths, new BookingsController()).getRouter();


export default router;