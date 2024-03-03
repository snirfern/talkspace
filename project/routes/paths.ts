import {
    createBookingWithUnusedCredit,
    getBookHistoryById,
    getPatientById,
    retrieveBooksByUserId
} from "../Utils/middleware_Validations";



const paths = (controller) => [
    {
        path: 'bookings',
        method: 'POST',
        handler: controller.createBookingWithUnusedCredit,
        middleware: createBookingWithUnusedCredit
    },
    {path: 'bookings', method: 'GET', handler: controller.retrieveUserById, middleware: retrieveBooksByUserId},
    {
        path: 'bookings/:bookingId/history',
        method: 'GET',
        handler: controller.getBookHistoryById,
        middleware: getBookHistoryById
    },
    {path: 'credits/:patientId', method: 'GET', handler: controller.getPatientIdCredits, middleware: getPatientById}

]


export default paths