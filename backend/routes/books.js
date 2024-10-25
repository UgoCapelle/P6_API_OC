const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const multer = require('../middleware/mutler-config');

router.post('/', multer, async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);
    
    const bookData = JSON.parse(req.body.book);
    console.log('Parsed book data:', bookData);

    const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    console.log('Generated image URL:', imageUrl);
    
    const book = new Book({
      ...bookData,
      imageUrl: imageUrl
    });

    const savedBook = await book.save();
    console.log('Book sauvegardé:', savedBook);

    res.status(201).json(savedBook);
  } catch (error) {
    console.error('Erreur dans la création du Book:', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    console.error('Erreur fetching books:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/bestrating', async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(books);
  } catch (error) {
    console.error('Erreur fetching best-rated books:', error);
    res.status(500).json({ message: 'Une erreur a eu lieu pendant le fatch des best-rated', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    console.error('Erreur fetching book:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    console.error('Erreur updating book:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(204).send();
  } catch (error) {
    console.error('Erreur deleting book:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rating', async (req, res) => {
  const { userId, rating } = req.body;
  const bookId = req.params.id;

  console.log('Rating request reçue:', { bookId, userId, rating });

  if (!userId) {
    return res.status(400).json({ message: 'UserId is required' });
  }


  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
    return res.status(400).json({ message: 'La note doit etre entre 0 et 5' });
  }

  try {
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book non trouvé' });
    }


    const existingRatingIndex = book.ratings.findIndex(
      r => r.userId.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      book.ratings[existingRatingIndex].grade = numericRating;
    } else {
      book.ratings.push({
        userId: userId,
        grade: numericRating
      });
    }

    const sum = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
    book.averageRating = Number((sum / book.ratings.length).toFixed(2));

    await book.save();

    const response = {
      _id: book._id,
      userId: book.userId,
      title: book.title,
      author: book.author,
      imageUrl: book.imageUrl,
      year: book.year,
      genre: book.genre,
      ratings: book.ratings,
      averageRating: book.averageRating
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erreur pendant le rating du book:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;