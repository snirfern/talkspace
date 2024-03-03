/*
I asked chatGPT to build for me a simple booking system with features for creating both standard and anonymous bookings.
Users can specify details like time, patient, provider, and booking status.
The application records booking status changes over time, providing a comprehensive status history.
Additionally, it associates bookings with unused credits and allows users to retrieve their booking history or the timeline of status changes for a specific booking.
The database is managed through Sequelize, offering a relational mapping to a MySQL database.
Please also allow to show the provider some statistic about bookings getting canceled by the client and being rescheduled, and the patient statistic about how many credits he used per month.
*/

/*

// General review for entire solution structure //

1. The solution does not handle failure mechanism for anything. it does not handle situations where the app will not go up.
2. The solution has no logs mechanism for handling failure situations of the app / scaling up edge cases/ errors.
3. The solution has no logs mechanism for handling user / provider statistics VS the app it self. the app behaviour is not trackable.
4. Endpoints are not secured, no users app  hierarchy is applied
5. No Authentication mechanism is applied, further more no middleware is applied, means the system is hackable / abuse-able
6. No Authorization mechanism is applied, further more , provider / reader can perform the same actions, which can cause troubles
7. The solution has a bad mix structure of DAL, models , controllers, routes and services( it has none of them) which is bad because it causes lack of modularity and coupled services / actions which is
   "a problem inviter" for the future usage of a system that is still small and none of its future usages are known.
8. No error types mentioned. all errors are not modular messages. they are just private errors as for the situations encountered.
9. No types for anything. string \ number \ any structurecodeReview.js
 */

import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
/*
CR
body parser is redundant for newest versions of nodejs...

 */
import {DataTypes, Sequelize} from 'sequelize';

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Create a single persistent MySQL database connection pool
const sequelize = new Sequelize('your_db_name', 'your_db_user', 'your_db_password', {
    host: 'localhost',
    dialect: 'mysql', // Use the appropriate database dialect
    logging: false, // Disable logging SQL queries (you can enable it for debugging)
});

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

// Define the relationship between Booking and Credit
Booking.belongsTo(Credit);
Credit.hasOne(Booking);

// Define the relationship between Booking and BookingStatusHistory
Booking.hasMany(BookingStatusHistory);
BookingStatusHistory.belongsTo(Booking);

// Function to execute database queries
async function executeQuery(query: string, params: any[] = []) {
    const connection = await sequelize.getConnection();
    try {
        const [rows] = await connection.query(query, params);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

// Function to get statistics on canceled and rescheduled bookings for a specific provider
async function getStats(providerId) {
    try {
        // Retrieve canceled and rescheduled bookings for the specified provider
        const stats = await Booking.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT CASE WHEN status = "canceled" THEN id END')), 'canceledBookings'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT CASE WHEN status = "rescheduled" THEN id END')), 'rescheduledBookings'],
            ],
            where: {
                provider: providerId,
                [sequelize.Op.or]: [{status: 'canceled'}, {status: 'rescheduled'}],
            },
        });

        // Extract the results from the stats
        const [result] = stats;

        // Prepare the statistic information
        const canceledBookings = result.getDataValue('canceledBookings') || 0;
        const rescheduledBookings = result.getDataValue('rescheduledBookings') || 0;

        return [
            canceledBookings,
            rescheduledBookings,
        ];
    } catch (error) {
        console.error('Error getting cancellation and reschedule statistics:', error);
        throw error;
    }
}

// Function to get monthly statistics on credits used by a specific patient, including the percentage
async function getCreditsUsedStats(patientId) {
    try {
        // Retrieve total credits available for the specified patient
        const totalCreditsQuery = await Credit.sum('type', {
            where: {
                BookingId: null, // Credits not associated with any booking
            },
        });

        // Retrieve monthly credits used by the specified patient
        const stats = await Booking.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN "Booking"."status" = "confirmed" THEN "Credit"."type" END')), 'totalCreditsUsed'],
                [sequelize.fn('MONTH', sequelize.col('"Booking"."time"')), 'month'],
                [sequelize.fn('YEAR', sequelize.col('"Booking"."time"')), 'year'],
            ],
            include: [
                {
                    model: Credit,
                    attributes: [],
                    where: {
                        BookingId: sequelize.literal('"Booking"."id"'), // Match Credit to Booking
                    },
                },
            ],
            where: {
                patient: patientId,
                status: 'confirmed',
            },
            group: ['month', 'year'],
        });

        // Extract the results from the stats
        const result = stats.map((row) => ({
            totalCreditsUsed: row.getDataValue('totalCreditsUsed') || 0,
            month: row.getDataValue('month'),
            year: row.getDataValue('year'),
        }));

        // Calculate the percentage for each month
        const totalCreditsAvailable = totalCreditsQuery || 1; // To avoid division by zero
        const monthlyStatsWithPercentage = result.map((row) => ({
            ...row,
            percentageCreditsUsed: (row.totalCreditsUsed / totalCreditsAvailable) * 100,
        }));

        return monthlyStatsWithPercentage;
    } catch (error) {
        console.error('Error getting monthly credits used statistics:', error);
        throw error;
    }
}


// Endpoint to create a booking with an unused credit
app.post('/bookings', async (req: Request, res: Response) => {
    const {time, patient, provider} = req.body;

    /*
    CR
     check  members extracted properly. prevent redundant query to db!
     */

    try {
        // Find an unused credit that is not expired
        const d = new Date();
        const credit = await Credit.findOne({
            where: {
                expirationDate: {
                    [sequelize.Op.gt]: d, // Expiration date is greater than the current date
                },
                BookingId: null, // Credit is not associated with any booking
            },
        });

        if (!credit) {
            return res.status(404).json({error: 'No unused, non-expired credits found.'});
        }

        // Create a booking associated with the credit
        const booking = await Booking.create({time, patient, provider});

        // Record the initial status in the booking status history
        await BookingStatusHistory.create({status, BookingId: booking.id});


        // Associate the booking with the credit
        await booking.setCredit(credit);

        res.status(201).json({
            message: 'Booking created successfully',
            booking: booking.toJSON(),
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({error: 'An error occurred while creating the booking.'});
    }
});


// Endpoint to retrieve bookings for a specific user (patient or provider)
app.get('/bookings', async (req: Request, res: Response) => {
    const {userId} = req.query;

    if (!userId) {
        return res.status(400).json({error: 'User ID must be provided as a query parameter.'});
    }

    try {
        // Retrieve bookings from the database for the specified user
        const bookings = await Booking.findAll({
            where: {
                [sequelize.Op.or]: [{patient: userId}, {provider: userId}],
            },
        });

        let stats = [];
        if (bookings?.[0].provider === userId) stats = await getStats(userId);

        res.status(200).json({bookings, stats});
    } catch (error) {
        console.error('Error retrieving bookings:', error);
        res.status(500).json({error: 'An error occurred while retrieving bookings.'});
    }
});

app.get('/bookings/:bookingId/history', async (req: Request, res: Response) => {
    const {bookingId} = req.params;
    /*
    CR
    Why waiting for db connection which very expensive action.
    first check the booking Id, check it is a valid booking id, tha execute the query
    if not a valid booking id return error message.

    it will speed up user's experience
   */
    try {
        // Retrieve the booking status history from the database for the specified booking
        const history = await BookingStatusHistory.findAll({
            where: {BookingId: bookingId},
            order: [['timestamp', 'ASC']], // Order by timestamp in ascending order
        });

        res.status(200).json({history});
    } catch (error) {
        console.error('Error retrieving booking status history:', error);
        res.status(500).json({error: 'An error occurred while retrieving booking status history.'});
    }
});

app.get('/credits/:patientId', async (req: Request, res: Response) => {
    const {patientId} = req.params;
    /*
    CR
    Why waiting for db connection which very expensive action.
    first check the patient Id, check it is a valid patient id, tha execute the query
    if not a valid patient id return error message.

    it will speed up user's experience
   */

    try {
        // get credits for the specified patient
        const credits = await Credit.findAll({
            where: {
                patient: patientId,
            },
        });
        // Retrieve the monthly credits used statistics from the database for the specified patient
        const stats = await getCreditsUsedStats(patientId);

        res.status(200).json({credits, stats});
    } catch (error) {
        console.error('Error retrieving monthly credits used statistics:', error);
        res.status(500).json({error: 'An error occurred while retrieving monthly credits used statistics.'});
    }
});

app.listen(port, () => {
    /*
    CR
    What happens if app executing fails? we just leave it like that?
    What about failure mechanism?
    what about alerting somewhere? console log will not help anyone since it is inside the pod / server
     */
    console.log(`Server is running on port ${port}`);
});