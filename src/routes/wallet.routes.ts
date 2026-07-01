import { Router } from 'express';
import { fundWallet, withdrawWallet } from '../controllers/wallet.controller.js';

const router = Router();

router.post('/fund', fundWallet);
router.post('/withdraw', withdrawWallet);

export default router;
