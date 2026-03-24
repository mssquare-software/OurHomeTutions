import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { BookingController } from '../controllers/bookingController';
import { validate } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const createBookingValidation = [
  body('classLevel').notEmpty().withMessage('Class level is required'),
  body('board').isIn(['cbse', 'state']).withMessage('Board must be CBSE or STATE'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('topics').optional().isArray().withMessage('Topics must be an array'),
  body('hours').isInt({ min: 1, max: 2 }).withMessage('Hours must be between 1 and 2'),
  body('mode').isIn(['online', 'offline']).withMessage('Mode must be online or offline'),
  body('date').notEmpty().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('lessonType').isIn(['single', 'group']).withMessage('Lesson type must be single or group'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('contact').matches(/^[6-9]\d{9}$/).withMessage('Contact must be a valid 10-digit mobile number'),
  body('address').if(body('mode').equals('offline')).notEmpty().withMessage('Address is required for offline sessions'),
  body('paymentMethod').optional().isIn(['razorpay', 'paypal', 'cash', 'upi', 'paytm']).withMessage('Invalid payment method'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number')
];

const updateStatusValidation = [
  param('id').notEmpty().withMessage('Booking ID is required'),
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
];

const updatePaymentValidation = [
  param('id').notEmpty().withMessage('Payment ID is required'),
  body('status').isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
  body('transactionId').optional().isString().withMessage('Transaction ID must be a string')
];

// Routes
router.post('/', createBookingValidation, validate, BookingController.createBooking);
router.get('/my-bookings', BookingController.getMyBookings);
router.get('/all', BookingController.getAllBookings); // Admin only
router.get('/:id', BookingController.getBookingDetails);
router.patch('/:id/status', updateStatusValidation, validate, BookingController.updateBookingStatus);
router.patch('/payment/:id/status', updatePaymentValidation, validate, BookingController.updatePaymentStatus);

export default router;
