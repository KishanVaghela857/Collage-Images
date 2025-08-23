const bcrypt = require('bcryptjs');
const Image = require('../models/Image');
const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res) => {
  try {
    const password = req.body.password || null;
    const file = req.file;  // multer.single puts file here

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    // Hash the password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create new Image document
    const image = new Image({
      filename: file.filename,
      password: hashedPassword,
      owner: req.user.id,  // from your JWT auth middleware
    });

    await image.save();

    return res.json({ message: 'Image uploaded', id: image._id });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Serve image with authentication (for logged-in users)
exports.serveImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if user owns the image or if image is public
    if (image.owner.toString() !== req.user.id && image.password) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const imagePath = path.join(__dirname, '../uploads', image.filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/*');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    // Stream the file
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// View image with password verification (for public access)
exports.viewImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;  // get password from request body

    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // If image has password protection
    if (image.password) {
      if (!password) {
        return res.status(401).json({ message: 'Password required' });
      }
      const isMatch = await bcrypt.compare(password, image.password);
      if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
    }

    const imagePath = path.join(__dirname, '../uploads', image.filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/*');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    // Stream the file
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);

  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.servePublicImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    if (image.password) return res.status(403).json({ message: 'Protected image' });

    const imagePath = path.join(__dirname, '../uploads', image.filename);
    if (!fs.existsSync(imagePath)) return res.status(404).json({ message: 'File not found' });

    res.setHeader('Content-Type', 'image/*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    fs.createReadStream(imagePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
