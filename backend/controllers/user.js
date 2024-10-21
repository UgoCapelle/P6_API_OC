const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé !' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Erreur de validation : ' + error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l’utilisateur : ' + error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé !' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Mot de passe invalide !' });
  }

  res.status(200).json({
    userId: user._id,
    token: jwt.sign(
      { userId: user._id },
      'RANDOM_TOKEN_SECRET',
      { expiresIn: '24h' }
    )
  });
};