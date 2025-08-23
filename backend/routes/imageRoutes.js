const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/auth');
const { uploadImage, viewImage, serveImage, servePublicImage } = require('../controllers/imageController');
const Image = require('../models/Image');
const bcrypt = require('bcryptjs'); // Added bcrypt for password hashing

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Route to fetch user's images
router.get('/', verifyToken, async (req, res) => {
  try {
    const images = await Image.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if image requires password
router.get('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.json({ 
      requiresPassword: !!image.password,
      message: image.password ? 'Password required' : 'No password required'
    });
  } catch (error) {
    console.error('Error checking image requirement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update image password
router.put('/:id/password', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check if user owns the image
    if (image.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this image' });
    }
    
    // Hash the password if provided, otherwise remove it
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    image.password = hashedPassword;
    await image.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify password for an image
router.post('/:id/verify-password', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check if user owns the image
    if (image.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this image' });
    }
    
    // If no password is set, allow access
    if (!image.password) {
      return res.json({ valid: true });
    }
    
    // If password is provided, verify it
    if (!password) {
      return res.json({ valid: false });
    }
    
    // Compare the provided password with the stored hash
    const isValid = await bcrypt.compare(password, image.password);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload image with authentication
router.post('/upload', verifyToken, upload.single('image'), uploadImage);
// View image by ID with optional password
router.post('/view/:id', viewImage);

// Serve image with authentication (for dashboard display)
router.get('/serve/:id', verifyToken, serveImage);

// Serve public image (no password)
router.get('/public/:id', servePublicImage);

module.exports = router;


// Delete image route
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
      const image = await Image.findById(req.params.id);
  
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }
  
      // Check if logged-in user is the owner of the image
      if (image.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this image' });
      }
  
      // Delete image file from uploads folder
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'uploads', image.filename);
  
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete image file:', err);
      });
  
      // Delete from DB
      await Image.findByIdAndDelete(req.params.id);
  
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });