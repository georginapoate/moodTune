// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getMe, getPromptHistory } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/history', protect, getPromptHistory);

module.exports = router;