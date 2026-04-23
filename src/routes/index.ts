import { Router, Request, Response, NextFunction } from 'express';
import authRoutes from './authRoutes';
import eventRoutes from './eventRoutes';
import orderRoutes from './orderRoutes';
import ticketRoutes from './ticketRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Wrapper pour Try/Catch global sur les routes asynchrones
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  });
};

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', orderRoutes);
router.use('/tickets', ticketRoutes);
router.use('/admin', adminRoutes);

// Test route
router.get('/ping', (req, res) => res.json({ success: true, pong: true, timestamp: new Date().toISOString() }));

export default router;
