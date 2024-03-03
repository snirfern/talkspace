export class CustomError extends Error {
    httpStatusCode: number;
    timestamp: string;

    constructor(httpStatusCode: number, errorMsg: string) {
        super(errorMsg ?? 'Error has occurred')
        this.httpStatusCode = httpStatusCode;
    }
}

export enum ErrorsMsg {
    MONTHLY_STATISTICS = 'Error retrieving monthly credits used statistics',
    BOOKING_STATUS_HISTORY = 'Error retrieving booking status history',
    RETRIEVING_BOOKINGS = 'Error retrieving bookings',
    CREATING_BOOKS = 'Error creating booking',
    NO_BOOKING_ID = 'No booking id found',
    NONE_EXPIRED_CREDITS_FOUND = 'No unused, non-expired credits found',
    MONTHLY_CREDITS_USED_STATISTICS = 'An error occurred while retrieving monthly credits used statistics',
    GETTING_CANCELLATION_AND_RESCHEDULE_STATISTICS = 'Error getting cancellation and reschedule statistics',
    MONTHLY_CREDITS_AND_STATISTICS = 'Error getting monthly credits used statistics'
}