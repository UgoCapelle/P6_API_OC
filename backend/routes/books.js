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
    console.log('Saved book:', savedBook);

    res.status(201).json(savedBook);
  } catch (error) {
    console.error('Error in book creation:', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rating', async (req, res) => {
  const { userId, grade } = req.body;
  
  if (!userId || !grade) {
    return res.status(400).json({ message: 'Informations manquantes (userId, grade).' });
  }

  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Vérifier si l'utilisateur a déjà noté le livre
    const existingRating = book.ratings.find(rating => rating.userId === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'Cet utilisateur a déjà noté ce livre.' });
    }

    // Ajouter la nouvelle note
    book.ratings.push({ userId, grade });

    // Mettre à jour la note moyenne
    const totalRatings = book.ratings.length;
    const totalGrades = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
    book.averageRating = totalGrades / totalRatings;

    await book.save();

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;