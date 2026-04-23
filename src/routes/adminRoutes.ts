import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as superAdminController from '../controllers/superAdminController';
import * as authController from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
 
const router = Router();
 
// Stats (General & Event specific)
router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER', 'STAFF'), adminController.getStats);
router.get('/recent-scans', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER', 'STAFF'), adminController.getRecentScans);
router.get('/participants', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), adminController.getParticipants);
router.get('/seed', authenticateToken, authorizeRoles('ADMIN'), adminController.seedTestData);
router.get('/tickets/export', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), adminController.exportTickets);
router.get('/participants/export', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), adminController.exportParticipants);
 
// Super-Admin Exclusive Routes
router.get('/global-stats', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getGlobalStats);
router.get('/events-supervision', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getEventsSupervision);
router.get('/organizers', authenticateToken, authorizeRoles('ADMIN'), adminController.getOrganizers);
router.get('/finances', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getFinances);
router.get('/moderation', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getModeration);
router.get('/settings', authenticateToken, authorizeRoles('ADMIN', 'ORGANIZER'), superAdminController.getSystemSettings);
 
router.post('/payouts', authenticateToken, authorizeRoles('ADMIN'), superAdminController.createPayout);
router.put('/payouts/:id', authenticateToken, authorizeRoles('ADMIN'), superAdminController.updatePayoutStatus);
router.post('/moderate-event', authenticateToken, authorizeRoles('ADMIN'), superAdminController.moderateEvent);
router.put('/settings', authenticateToken, authorizeRoles('ADMIN'), superAdminController.updateSystemSettings);
 
// Client Space (Super-Admin)
router.get('/client-space', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getClientSpace);
router.get('/events/:id/feedbacks', authenticateToken, authorizeRoles('ADMIN'), superAdminController.getEventFeedbacks);
 
// --- GESTION DES ORGANISATEURS ---
router.patch('/organizers/:id/suspend', authenticateToken, authorizeRoles('ADMIN'), adminController.toggleSuspendOrganizer);
router.delete('/organizers/:id', authenticateToken, authorizeRoles('ADMIN'), adminController.deleteOrganizer);
 
export default router;