const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book');
const multer = require('../middleware/mutler-config');


router.post('/', multer, bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/bestrating', bookController.getBestRatedBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', multer, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.post('/:id/rating', bookController.rateBook);

module.exports = router;