import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticateToken, optionalAuthenticateToken, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
 
const router = Router();
 
router.get('/', optionalAuthenticateToken, eventController.getEvents);
router.post('/validate-access-code', eventController.validateAccessCode);
router.post('/:id/regenerate-access-code', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.regenerateAccessCode);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), validate(eventController.eventSchema), eventController.createEvent);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.updateEvent);
router.put('/:id/toggle-status', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.toggleEventStatus);
router.post('/:id/close', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.closeEvent);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.deleteEvent);
router.get('/:id', eventController.getEventById);
 
// Promo Codes
router.get('/:id/promo-codes', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.getPromoCodes);
router.post('/:id/promo-codes', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.createPromoCode);
router.delete('/:id/promo-codes/:codeId', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.deletePromoCode);
router.put('/:id/promo-codes/:codeId/toggle', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.togglePromoCode);
router.post('/validate-promo', eventController.validatePromoCode);
 
// Partners
router.get('/:id/partners', eventController.getPartners);
router.post('/:id/partners', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.addPartner);
router.post('/:id/partners/checkout', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.checkoutPartner);
router.post('/partners/webhook', eventController.handlePartnerPaymentWebhook);
router.delete('/:id/partners/:partnerId', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), eventController.deletePartner);
 
// Feedback & Support
router.post('/:id/feedback', authenticateToken, eventController.submitFeedback);
router.post('/:id/support', authenticateToken, eventController.submitSupportTicket);
 
export default router;