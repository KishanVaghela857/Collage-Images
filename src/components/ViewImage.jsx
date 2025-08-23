import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ViewImage.css';

export default function ViewImage() {
  const { id } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if image requires password on component mount
  useEffect(() => {
    checkImageRequirement();
  }, [id]);

  const checkImageRequirement = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/images/${id}/check`, {
        method: 'GET',
      });
      
      if (res.status === 200) {
        const data = await res.json();
        if (!data.requiresPassword) {
          // If no password required, load image directly
          loadImage();
        }
      }
    } catch (error) {
      console.error('Error checking image requirement:', error);
    }
  };

  const loadImage = async () => {
    setIsLoading(true);
    setMessage('Loading image...');

    try {
      const res = await fetch(`http://localhost:5000/api/images/view/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.status === 200) {
        // Get image blob
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setMessage('');
      } else {
        const data = await res.json();
        setMessage(data.message || 'Failed to load image');
      }
    } catch {
      setMessage('Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setMessage('Please enter a password');
      return;
    }
    await loadImage();
  };

  if (imageUrl) {
    return (
      <div className="view-image-container">
        <div className="image-viewer">
          <h2>Protected Image</h2>
          <div className="image-container">
            <img src={imageUrl} alt="Protected" className="viewed-image" />
          </div>
          <div className="actions">
            <Link to="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
            <button 
              onClick={() => {
                setImageUrl('');
                setPassword('');
                setMessage('');
              }} 
              className="btn btn-secondary"
            >
              View Another Image
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-image-container">
      <div className="password-form">
        <h2>Enter Password to View Image</h2>
        <p className="subtitle">This image is password protected</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              placeholder="Enter image password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'View Image'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('error') || message.includes('Failed') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}
        
        <div className="actions">
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
