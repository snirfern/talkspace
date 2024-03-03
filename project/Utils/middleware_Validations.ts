import {CustomError} from "../Errors/Errrors";

enum ErrorsMsg {
    DATA_RECEIVED_IS_CORRUPTED = 'Data received is courted',
    MISSING_USER_ID = 'User ID must be provided as a query parameter',
    MISSING_BOOK_ID = 'Bad book id supplied',
    MISSING_PATIENT_ID = 'Bad patient id supplied'

}

export const createBookingWithUnusedCredit = (req, res, next) => {
    const {time, patient, provider} = req.body;
    if (!time || !patient || !provider) {
        throw new CustomError(400, ErrorsMsg.DATA_RECEIVED_IS_CORRUPTED)
    }
    next();
}

// Endpoint to retrieve bookings for a specific user (patient or provider)
export const retrieveBooksByUserId = (req, res, next) => {
    if (!req?.query?.userId) {
        throw new CustomError(400, ErrorsMsg.MISSING_USER_ID)
    }
    next();
}
// Endpoint to get book history by id
export const getBookHistoryById = (req, res, next) => {
    if (!req?.query?.bookingId) {
        throw new CustomError(400, ErrorsMsg.MISSING_BOOK_ID)
    }
    next();
}
// Endpoint to patient data by id
export const getPatientById = (req, res, next) => {
    if (!req?.query?.patientId) {
        throw new CustomError(400, ErrorsMsg.MISSING_PATIENT_ID)
    }
    next();
}