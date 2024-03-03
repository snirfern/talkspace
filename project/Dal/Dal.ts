import {Sequelize} from 'sequelize';
import {Booking, BookingStatusHistory} from "../models/Book";
import {Credit} from "../models/Credit";


Booking.belongsTo(Credit);
Credit.hasOne(Booking);

Booking.hasMany(BookingStatusHistory);
BookingStatusHistory.belongsTo(Booking);

const dbInstances = {}

interface Query {
    [key: string]: any;
}

interface GeneraCreationResponse {
    [key: string]: any
}

class DAL {
    public readonly sequelize: Sequelize;

    constructor(dbName) {
        const newDbInstanceKey = dbInstances[`dbName_${dbName}_dbHost_${process.env.DB_HOST}`]
        if (dbInstances[newDbInstanceKey]) {
            return dbInstances[newDbInstanceKey];
        }
        this.sequelize = new Sequelize(`${dbName}`, `${process.env.DB_USER}`, `${process.env.DB_PASS}`, {
            host: `${process.env.DB_HOST}`,
            dialect: 'mysql',
            logging: false,
            retry: {
                max: 5
            }
        });
        dbInstances[newDbInstanceKey] = this;

    }


    async findOne(model, query: Query): Promise<any> {
        return await model.findOne(query);
    }

    async findAll(model, query: Query): Promise<any[]> {
        return await model.findAll(query);
    }

    async updateOne(model, criteria: Query, newValue: GeneraCreationResponse): Promise<GeneraCreationResponse> {
        return await model.update(newValue, criteria);
    }


    async insertOne(model, record): Promise<GeneraCreationResponse> {
        return await model.create(record);
    }

    async sum(model, field, query: Query): Promise<number> {
        return await model.sum(field, query)
    }


}

export default DAL;