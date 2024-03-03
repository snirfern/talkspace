import {DataTypes, Sequelize} from 'sequelize';
import DAL from "../Dal/Dal";

const sequelize = new DAL('books').sequelize;
// Define the Booking model
const Booking = sequelize.define('Booking', {
    time: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString(),
        },
    },
    patient: {
        type: DataTypes.STRING,
        allowNull: true, // Allow anonymous bookings
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', // Default status
    },
});

const BookingStatusHistory = sequelize.define('BookingStatusHistory', {
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
});


interface BookingInterface {
    id:string,
    time: string,
    patient: string,
    provider: string,
    status: string
}

interface BookingStatusHistoryInterface {
    status: string;
    timestamp: string;
}

export {Booking, BookingStatusHistory, BookingInterface, BookingStatusHistoryInterface}