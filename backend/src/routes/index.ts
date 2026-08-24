import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import organisationRoutes from '../modules/organisations/routes';
import userRoutes from '../modules/users/routes';
import customerRoutes from '../modules/customers/routes';
import quotationRoutes from '../modules/quotations/routes';
import invoiceRoutes from '../modules/invoices/routes';
import paymentRoutes from '../modules/payments/routes';
import documentRoutes from '../modules/documents/routes';
import verifiedPaymentRoutes from '../modules/verifiedPayments/routes';
import adminRoutes from '../modules/admin/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/quotations', quotationRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/verified-payments', verifiedPaymentRoutes);
// Cross-tenant, platform-staff only. Guarded inside its own router.
router.use('/admin', adminRoutes);

export default router;
