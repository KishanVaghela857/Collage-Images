import React from 'react';

export default function ImageEditorModal({ image, onClose, onSave }) {
  let imgSrc = image.url || (image.imageId || image._id || image.id ? `http://localhost:5000/api/images/public/${image.imageId || image._id || image.id}` : null);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Image</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Image editing UI will go here (crop, rotate, etc.) */}
          {imgSrc ? (
            <img src={imgSrc} alt="To Edit" style={{ maxWidth: '100%' }} />
          ) : (
            <div>No image to display.</div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onSave(image)}>Save</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
} 