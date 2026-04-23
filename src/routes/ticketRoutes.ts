import { Router } from 'express';
import * as ticketController from '../controllers/ticketController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/my', authenticateToken, ticketController.getMyTickets);
router.post('/validate', validate(ticketController.validateSchema), ticketController.validateTicket);
router.post('/sync', authenticateToken, ticketController.syncTickets);

export default router;
