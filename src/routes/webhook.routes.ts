import express, { Router } from 'express';
import { handleSpotflowWebhook } from '../controllers/webhook.controller.js';

const router = Router();


router.post('/spotflow', express.raw({ type: '*/*' }), handleSpotflowWebhook);

export default router;
