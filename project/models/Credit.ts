import {DataTypes} from 'sequelize';
import DAL from "../Dal/Dal";

const sequelize = new DAL('books').sequelize;

// Define the Credit model
const Credit = sequelize.define('Credit', {
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString(),
        },
    },
});

interface CreditInterface {
    id:string,
    type: string;
    expirationDate: string;
}

export {Credit, CreditInterface}