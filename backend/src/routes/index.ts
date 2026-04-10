import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import organisationRoutes from '../modules/organisations/routes';
import userRoutes from '../modules/users/routes';
import customerRoutes from '../modules/customers/routes';
import quotationRoutes from '../modules/quotations/routes';
import invoiceRoutes from '../modules/invoices/routes';
import paymentRoutes from '../modules/payments/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/quotations', quotationRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);

export default router;
