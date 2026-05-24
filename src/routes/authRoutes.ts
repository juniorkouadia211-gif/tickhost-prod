import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/register', validate(authController.registerSchema), authController.register);
router.post('/login', validate(authController.loginSchema), authController.login);
router.put('/payment-info', authenticateToken, authController.updatePaymentInfo);
router.put('/change-password', authenticateToken, authController.changePassword);
router.put('/notification-prefs', authenticateToken, authController.updateNotificationPrefs);

export default router;
