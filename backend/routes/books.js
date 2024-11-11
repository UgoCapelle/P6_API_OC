const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book');
const multer = require('../middleware/mutler-config');
const auth = require('../middleware/authMiddleware');


router.post('/', auth, multer, bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/bestrating', bookController.getBestRatedBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', auth, multer, bookController.updateBook);
router.delete('/:id', auth, bookController.deleteBook);
router.post('/:id/rating', auth, bookController.rateBook);

module.exports = router;