const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');

const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  const filename = imageUrl.split('/images/')[1];
  if (!filename) return;
  const imagePath = path.join(__dirname, '..', 'images', filename);
  fs.unlink(imagePath, (err) => {
    if (err) console.error('Error deleting image file:', err);
    else console.log(`Successfully deleted image: ${filename}`);
  });
};

exports.createBook = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

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
};

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    console.error('Erreur fetching books:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBestRatedBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(books);
  } catch (error) {
    console.error('Erreur fetching best-rated books:', error);
    res.status(500).json({ message: 'Une erreur a eu lieu pendant le fetch des best-rated', error: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    console.error('Erreur fetching book:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const oldBook = await Book.findById(req.params.id);
    if (!oldBook) return res.status(404).json({ message: 'Livre non trouvé' });

    if (oldBook.userId !== req.userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    let updatedBookData;
    if (req.file) {
      deleteImageFile(oldBook.imageUrl);
      updatedBookData = JSON.parse(req.body.book);
      const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      updatedBookData.imageUrl = imageUrl;
    } else {
      updatedBookData = req.body;
    }
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updatedBookData, { new: true });
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Erreur de mise à jour du livre:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Livre non trouvé' });

    if (book.userId !== req.userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    deleteImageFile(book.imageUrl);
    await Book.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur de suppression du livre:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.rateBook = async (req, res) => {
  const { userId, rating } = req.body;
  const bookId = req.params.id;

  console.log('Rating request reçue:', { bookId, userId, rating });

  if (!userId) {
    return res.status(400).json({ message: 'UserId is required' });
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
    return res.status(400).json({ message: 'La note doit être entre 0 et 5' });
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
};