const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

const multerConfig = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors du téléchargement de l\'image.' });
    }

    if (req.file) {
      const outputFileName = `${req.file.originalname.split(' ').join('_').split('.')[0]}_${Date.now()}.webp`;
      const outputPath = path.join('images', outputFileName);

      try {
        await sharp(req.file.buffer)
          .resize(206, 260)
          .toFormat('webp')
          .toFile(outputPath);

        req.file.path = outputPath;
        req.file.filename = outputFileName;

      } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la transformation de l\'image.' });
      }
    }
    next();
  });
};

module.exports = multerConfig;