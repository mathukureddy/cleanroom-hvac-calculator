const express = require('express');
const router = express.Router();
const standardController = require('../controllers/standardController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, standardController.getAllStandards);
router.get('/classifications', authMiddleware, standardController.getAllClassifications);
router.get('/:standardId/classifications', authMiddleware, standardController.getClassificationsByStandard);

module.exports = router;
