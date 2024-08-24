const express = require('express');
const router = express.Router();
const product = require('../controllers/productController');
const multer = require('multer');

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

router.post('/products', upload.single('file'), product.uploadProductData);

router.get('/products', product.getAllProducts)

router.delete('/products', product.deleteProducts)

module.exports = router; 
