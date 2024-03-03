import express, {Response} from 'express';
import UserStatistics from "../../services/UserStatisticsService";
import UserStatisticsService from "../../services/UserStatisticsService";
import {patientRequestWithParams, RequestBody, RequestWithParams, RequestWithQuery} from "./interface";
import {CustomError, ErrorsMsg} from "../../Errors/Errrors";
import {Logger} from "../../Utils/Logger";
import BookingService from "../../services/BookingService";


class BookingsController {
    private userStatisticsService: UserStatisticsService;
    private bookingService: BookingService
    private logger: Logger;

    constructor() {
        this.userStatisticsService = new UserStatistics()
        this.bookingService = new BookingService()
        this.logger = new Logger('users')
    }


    async createBookingWithUnusedCredit(req: express.Request<{}, {}, RequestBody>, res: Response) {
        const {time, patient, provider} = req.body;

        try {
            const credit = await this.bookingService.findCreditByDate()

            if (!credit) {
                res.status(404).json({message: 'No credit found'}).end();
            }

            const booking = await this.bookingService.createBooking(time, patient, provider)

            if (!booking?.id) {
                res.status(404).json({message: 'No booking id found'}).end();
            }

            await this.bookingService.createBookingStatusHistory(status, booking.id);


            await this.bookingService.setCredit(credit);

            res.status(201).json({
                message: 'Booking created successfully',
                booking: booking,
            });
        } catch (error) {
            this.logger.error(ErrorsMsg.CREATING_BOOKS, error);
            throw new CustomError(error.status, error.message);
        }
    }


    async retrieveUserById(req: RequestWithQuery, res: Response) {
        const {userId} = req.query;

        try {
            const bookings = this.bookingService.getBookings(userId);

            let stats = [];
            if (bookings?.[0].provider === userId) stats = await this.userStatisticsService.getStats(userId);

            res.status(200).json({bookings, stats});
        } catch (error) {
            this.logger.error(ErrorsMsg.RETRIEVING_BOOKINGS, error);
            throw new CustomError(500, ErrorsMsg.RETRIEVING_BOOKINGS)
        }
    }

    async getBookHistoryById(req: RequestWithParams, res: Response) {
        const {bookingId} = req.params;

        try {
            const history = await this.bookingService.getBookHistoryById(bookingId);

            res.status(200).json({history});
        } catch (error) {
            this.logger.error(ErrorsMsg.BOOKING_STATUS_HISTORY, error);
            throw new CustomError(500, ErrorsMsg.BOOKING_STATUS_HISTORY)
        }
    }

    async getPatientIdCredits(req: patientRequestWithParams, res: Response) {
        const {patientId} = req.params;

        try {
            const credits = await this.userStatisticsService.getCreditsByPatientId(patientId);
            const stats = await this.userStatisticsService.getCreditsUsedStats(patientId);

            res.status(200).json({credits, stats});

        } catch (error) {
            this.logger.error(ErrorsMsg.MONTHLY_STATISTICS, error);
            throw new CustomError(500, ErrorsMsg.MONTHLY_CREDITS_USED_STATISTICS)
        }
    }
}

export default BookingsController;