import {Booking} from "../models/Book";
import {Credit, CreditInterface} from "../models/Credit";
import {CustomError, ErrorsMsg} from "../Errors/Errrors";
import DAL from "../Dal/Dal";
import {Op} from '@sequelize/core';
import {Logger} from "../Utils/Logger";

interface GetCreditUsedStats {
    totalCreditsUsed: number;
    month: number;
    year: number;
    percentageCreditsUsed: number;
}

interface GetStats {
    canceledBookings: any;
    rescheduledBookings: any;
}

class UserStatisticsService {
    private dal: DAL;
    private logger: Logger;

    constructor() {
        this.dal = new DAL('books')
        this.logger = new Logger('users')

    }

    async getStats(providerId: string): Promise<GetStats[]> {
        try {
            const stats = await this.dal.findAll(Booking, {
                attributes: [
                    [Op.fn('COUNT', Op.literal('DISTINCT CASE WHEN status = "canceled" THEN id END')), 'canceledBookings'],
                    [Op.fn('COUNT', Op.literal('DISTINCT CASE WHEN status = "rescheduled" THEN id END')), 'rescheduledBookings'],
                ],
                where: {
                    provider: providerId,
                    [Op.or]: [{status: 'canceled'}, {status: 'rescheduled'}],
                },
            });

            const [result] = stats;

            const canceledBookings = result.getDataValue('canceledBookings') || 0;
            const rescheduledBookings = result.getDataValue('rescheduledBookings') || 0;

            return [
                canceledBookings,
                rescheduledBookings,
            ];
        } catch (error) {

            this.logger.error(ErrorsMsg.GETTING_CANCELLATION_AND_RESCHEDULE_STATISTICS, error);
            throw new CustomError(error.status, error.message);
        }
    }

    async getCreditsByPatientId(patientId: string): Promise<CreditInterface[]> {
        return await this.dal.findAll(Credit, {
            where: {
                patient: patientId,
            },
        });
    }


    async getCreditsUsedStats(patientId): Promise<GetCreditUsedStats[]> {
        try {
            const totalCreditsQuery = await this.dal.sum(Credit, 'type', {
                where: {
                    BookingId: null,
                },
            });

            const stats = await this.dal.findAll(Booking, {
                attributes: [
                    [Op.fn('SUM', Op.literal('CASE WHEN "Booking"."status" = "confirmed" THEN "Credit"."type" END')), 'totalCreditsUsed'],
                    [Op.fn('MONTH', Op.col('"Booking"."time"')), 'month'],
                    [Op.fn('YEAR', Op.col('"Booking"."time"')), 'year'],
                ],
                include: [
                    {
                        model: Credit,
                        attributes: [],
                        where: {
                            BookingId: Op.literal('"Booking"."id"'),
                        },
                    },
                ],
                where: {
                    patient: patientId,
                    status: 'confirmed',
                },
                group: ['month', 'year'],
            });

            const result = stats.map((row) => ({
                totalCreditsUsed: row.getDataValue('totalCreditsUsed') || 0,
                month: row.getDataValue('month'),
                year: row.getDataValue('year'),
            }));

            const totalCreditsAvailable = totalCreditsQuery || 1;
            return result.map((row) => ({
                ...row,
                percentageCreditsUsed: (row.totalCreditsUsed / totalCreditsAvailable) * 100,
            }));
        } catch (error) {
            this.logger.error(ErrorsMsg.MONTHLY_CREDITS_AND_STATISTICS, error);
            throw new CustomError(error.status, error.message);

        }
    }
}

export default UserStatisticsService