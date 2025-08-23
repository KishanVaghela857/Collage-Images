import React, { useState, useEffect } from 'react';
import './Collage.css';
import ImageEditorModal from './ImageEditorModal';
import ColorThief from 'color-thief-browser';

function PasswordModal({ open, onClose, onSubmit, error }) {
  const [password, setPassword] = useState('');
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Enter Password</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>This image is protected. Please enter the password to continue.</p>
          <input
            type="password"
            className="modal-password-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="message error">{error}</div>}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => onSubmit(password)}>Submit</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedImage({ imageId, isProtected, alt, className, style, onClick }) {
  if (isProtected) {
    return (
      <img
        src="/lock-placeholder.png" // ✅ replace with a real placeholder asset
        alt="Protected"
        className={className + ' protected-blur'}
        style={style}
        onClick={onClick}
      />
    );
  }
  return (
    <img
      src={`http://localhost:5000/api/images/public/${imageId}`}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
}

export default function Collage({ images: uploadedImages = [], onRefresh }) {
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');
  const [uploadPasswordModal, setUploadPasswordModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(new Set());
  const [unlockModal, setUnlockModal] = useState({ open: false, img: null, action: null });
  const [passwordError, setPasswordError] = useState('');
  const [editorImage, setEditorImage] = useState(null);
  const [collageBg, setCollageBg] = useState('');

  useEffect(() => {
    setImages(uploadedImages);
  }, [uploadedImages]);

  const processFiles = (files) => {
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      password: '',
      uploaded: false,
      imageId: '',
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleUpload = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length) processFiles(files);
  };

  const updatePassword = (id, value) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, password: value } : img));
  };

  const token = localStorage.getItem('token');

  const uploadToServer = async (img) => {
    if (!token) return setMessage('Please login first.');
    setUploadingImages(prev => new Set(prev).add(img.id));

    const formData = new FormData();
    formData.append('image', img.file);
    formData.append('password', img.password || '');

    try {
      const res = await fetch('http://localhost:5000/api/images/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploaded: true, imageId: data.id } : i));

        if (img.password) {
          setMessage('Image uploaded with password!');
          onRefresh?.();
        } else {
          setSelectedImage({ ...img, imageId: data.id });
          setUploadPasswordModal(true);
        }
      } else {
        setMessage(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Upload failed. Try again.');
    } finally {
      setUploadingImages(prev => { const s = new Set(prev); s.delete(img.id); return s; });
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedImage) return;
    try {
      const res = await fetch(`http://localhost:5000/api/images/${selectedImage.imageId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: modalPassword }),
      });

      if (res.ok) {
        setUploadPasswordModal(false);
        setModalPassword('');
        setSelectedImage(null);
        setMessage('Password set successfully!');
        onRefresh?.();
      } else {
        const data = await res.json();
        setMessage(data.message || 'Failed to set password');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to set password. Try again.');
    }
  };

  const handleModalClose = () => {
    setUploadPasswordModal(false);
    setSelectedImage(null);
    setModalPassword('');
    setMessage('Image uploaded successfully!');
    onRefresh?.();
  };

  const checkPassword = async (img, password) => {
    try {
      const res = await fetch(`http://localhost:5000/api/images/${img.imageId || img._id}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      if (res.ok) return (await res.json()).valid;
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handlePasswordSubmit = async (password) => {
    const { img, action } = unlockModal;
    const isValid = await checkPassword(img, password);
    if (!isValid) return setPasswordError('Incorrect password.');

    setUnlockModal({ open: false, img: null, action: null });
    setPasswordError('');

    if (action === 'view') {
      window.open(`/view/${img.imageId || img._id}`, '_blank');
    } else if (action === 'share') {
      navigator.clipboard.writeText(`${window.location.origin}/view/${img.imageId || img._id}`);
      alert('Share link copied!');
    } else if (action === 'download') {
      window.open(`http://localhost:5000/api/images/serve/${img.imageId || img._id}`, '_blank');
    }
  };

  const handleGenerateBackground = () => {
    const colorThief = new ColorThief();
    const imgEls = Array.from(document.querySelectorAll('.image-preview'));
    const colors = [];
    imgEls.forEach(img => {
      try {
        if (img.complete && img.naturalHeight !== 0) {
          const c = colorThief.getColor(img);
          colors.push(c);
        }
      } catch {}
    });
    if (colors.length) {
      const [c1, c2] = [colors[0], colors[1] || colors[0]];
      setCollageBg(`linear-gradient(135deg, rgb(${c1.join(',')}), rgb(${c2.join(',')}))`);
    }
  };

  return (
    <div className="collage-container" style={collageBg ? { background: collageBg } : {}}>
      <h2>Upload Your Collage</h2>
      {message && <p className="message">{message}</p>}

      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drag & Drop Images Here</h3>
          <p>or click to browse files</p>
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="file-input" />
        </div>
      </div>

      <div className="images-grid">
        {images.map(img => (
          <div key={img._id || img.id} className="image-card">
            <ProtectedImage
              imageId={img.imageId || img._id || img.id}
              isProtected={!!img.password}
              alt="Collage"
              className={img.password ? 'image-preview protected-blur' : 'image-preview'}
              onClick={img.password ? () => setUnlockModal({ open: true, img, action: 'view' }) : undefined}
              style={{ cursor: img.password ? 'pointer' : 'default' }}
            />

            {!img.uploaded && (
              <>
                <button onClick={() => setEditorImage(img)} className="edit-btn">✏️ Edit</button>
                <input
                  type="password"
                  placeholder="Set Password (optional)"
                  value={img.password || ''}
                  onChange={(e) => updatePassword(img.id, e.target.value)}
                  className="password-input"
                  disabled={img.uploaded}
                />
                <button
                  onClick={() => uploadToServer(img)}
                  className="upload-btn"
                  disabled={uploadingImages.has(img.id)}
                >
                  {uploadingImages.has(img.id) ? '⏳ Uploading...' : '⬆️ Upload'}
                </button>
              </>
            )}

            {img.uploaded && (
              <div className="share-section">
                <p className="share-text">Share Link:</p>
                <div className="share-link">
                  <input type="text" value={`${window.location.origin}/view/${img.imageId}`} readOnly className="share-input" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/view/${img.imageId}`); alert('Copied!'); }} className="copy-btn">Copy</button>
                </div>
                <a href={`/view/${img.imageId}`} target="_blank" rel="noopener noreferrer" className="view-link" onClick={img.password ? (e) => { e.preventDefault(); setUnlockModal({ open: true, img, action: 'view' }); } : undefined}>🔗 View Image</a>
                <button onClick={() => deleteImage(img.imageId)} className="delete-btn">🗑️ Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {uploadPasswordModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Password for Image</h3>
              <button className="modal-close" onClick={handleModalClose}>×</button>
            </div>
            <div className="modal-body">
              <p>Your image was uploaded! Optionally set a password.</p>
              <img src={selectedImage?.url} alt="Preview" className="modal-image-preview" />
              <input type="password" value={modalPassword} onChange={(e) => setModalPassword(e.target.value)} placeholder="Enter password" className="modal-password-input" />
              <div className="modal-actions">
                <button onClick={handleModalSubmit} className="btn btn-primary">Set Password</button>
                <button onClick={handleModalClose} className="btn btn-secondary">Skip</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PasswordModal open={unlockModal.open} onClose={() => setUnlockModal({ open: false, img: null, action: null })} onSubmit={handlePasswordSubmit} error={passwordError} />

      {editorImage && <ImageEditorModal image={editorImage} onClose={() => setEditorImage(null)} onSave={(edited) => { setImages(prev => prev.map(i => i.id === editorImage.id ? { ...i, ...edited } : i)); setEditorImage(null); }} />}
    </div>
  );
}