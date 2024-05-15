import { Router } from 'express';
import {
  contactUs,
 
} from '../controllers/miscellaneous.controller.js';
import { authorizeRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

// {{URL}}/api/v1/
router.route('/contact')
.post(contactUs);


export default router;