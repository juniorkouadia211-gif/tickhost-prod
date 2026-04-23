import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { validate } from '../middlewares/validate';

const router = Router();

router.post('/', validate(orderController.orderSchema), orderController.createOrder);
router.post('/webhook', orderController.webhook);
router.post('/webhook/cinetpay', orderController.webhook);

export default router;
