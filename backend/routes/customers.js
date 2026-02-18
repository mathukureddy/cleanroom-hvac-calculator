const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, customerController.getAllCustomers);
router.get('/:id', authMiddleware, customerController.getCustomerById);
router.post('/', authMiddleware, adminMiddleware, customerController.createCustomer);
router.put('/:id', authMiddleware, adminMiddleware, customerController.updateCustomer);
router.delete('/:id', authMiddleware, adminMiddleware, customerController.deleteCustomer);

module.exports = router;
