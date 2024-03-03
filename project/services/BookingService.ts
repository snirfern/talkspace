import DAL from "../Dal/Dal";
import {Credit, CreditInterface} from "../models/Credit";
import {Booking, BookingInterface, BookingStatusHistory, BookingStatusHistoryInterface} from "../models/Book";
import {Op} from '@sequelize/core';


class BookingService {
    private dal: DAL;

    constructor() {
        this.dal = new DAL('books')
    }

    async getBookings(userId: string): Promise<BookingInterface[]> {
        return await this.dal.findAll(Booking, {
            where: {
                [Op.or]: [{patient: userId}, {provider: userId}],
            }
        })
    }

    async findCreditByDate(date?: Date): Promise<CreditInterface> {
        return await this.dal.findOne(Credit, {
            where: {
                expirationDate: {
                    [Op.gt]: date ?? new Date(),
                },
                BookingId: null,
            },
        })


    }

    async setCredit(credit: CreditInterface): Promise<boolean> {
        const res = await this.dal.updateOne(Credit, {
            where: {
                type: null
            }
        }, credit);
        return res?.id;
    }

    async createBooking(time: string, patient: string, provider: string): Promise<BookingInterface> {
        const res = await this.dal.insertOne(Booking, {'time': time, 'patient': patient, 'provider': provider});
        return res?.id
    }

    async createBookingStatusHistory(status: string, bookingId: string): Promise<boolean> {
        const res = await this.dal.insertOne(BookingStatusHistory, {'status': status, 'bookingId': bookingId});
        return res?.id;
    }

    async getBookHistoryById(bookingId: string, order?: string, sortParameter?: string): Promise<BookingStatusHistoryInterface[]> {
        return await this.dal.findAll(BookingStatusHistory, {
            where: {BookingId: bookingId},
            order: [[sortParameter ?? 'timestamp', order ?? 'ASC']]
        });
    }
}

export default BookingService;