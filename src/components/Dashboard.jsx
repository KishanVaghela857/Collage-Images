import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Collage from './Collage';
import './Dashboard.css';
import Loader from './Loader'

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
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!isProtected) {
      setSrc(`http://localhost:5000/api/images/public/${imageId}`);
      return;
    }
    // For protected images, fetch as blob with Authorization
    const fetchImage = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/images/serve/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        setSrc(URL.createObjectURL(blob));
      } else {
        setSrc('');
      }
    };
    fetchImage();
    return () => { if (src) URL.revokeObjectURL(src); };
  }, [imageId, isProtected]);

  return <img src={src} alt={alt} className={className} style={style} onClick={onClick} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState({ open: false, img: null, action: null });
  const [passwordError, setPasswordError] = useState('');


  const fetchImages = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    fetch('http://localhost:5000/api/images', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch images');
        return res.json();
      })
      .then(data => setImages(data))
      // setLoading(false)
      .catch(err => console.error('Error fetching images:', err));
    setLoading(false)
  };

  useEffect(() => {
    fetchImages();
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateCollage = () => {
    setActiveTab('collages');
    showNotification('Switched to upload tab! 🎨');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'upload':
        setActiveTab('collages');
        showNotification('Ready to upload! 📷');
        break;
      case 'create':
        setActiveTab('collages');
        showNotification('Create mode activated! 🎨');
        break;
      case 'share':
        setActiveTab('shared');
        showNotification('Viewing protected collages! 🔒');
        break;
      case 'settings':
        showNotification('Settings feature coming soon! ⚙️');
        break;
      default:
        break;
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter images based on search and filter type
  const filteredImages = images.filter(img => {
    const matchesSearch = img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' ||
      (filterType === 'protected' && img.password) ||
      (filterType === 'public' && !img.password);
    return matchesSearch && matchesFilter;
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate statistics from actual data
  const totalCollages = images.length;
  const sharedCollages = images.filter(img => img.password).length;
  const privateCollages = images.filter(img => !img.password).length;
  const favorites = images.length; // You can add a favorites field to your image model later
  const recentCollages = images.filter(img => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(img.createdAt) > oneWeekAgo;
  }).length;

  const stats = [
    { title: 'Total Collages', value: totalCollages.toString(), icon: '🎨', color: '#6366f1', subtitle: 'All your creations' },
    { title: 'Protected', value: sharedCollages.toString(), icon: '🔒', color: '#f59e0b', subtitle: 'Password secured' },
    { title: 'Public', value: privateCollages.toString(), icon: '📤', color: '#10b981', subtitle: 'Freely shared' },
    { title: 'This Week', value: recentCollages.toString(), icon: '⭐', color: '#ef4444', subtitle: 'Recent uploads' }
  ];

  // const recentCollages = [
  //   { id: 1, name: 'Summer Memories', date: '2024-01-15', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop' },
  //   { id: 2, name: 'Travel Adventures', date: '2024-01-14', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop' },
  //   { id: 3, name: 'Family Photos', date: '2024-01-13', thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop' },
  //   { id: 4, name: 'Nature Collection', date: '2024-01-12', thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop' }
  // ];

  const deleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/images/delete/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setImages(prev => prev.filter(img => img._id !== imageId));
        alert('Image deleted successfully');
      } else {
        const data = await res.json();
        alert('Delete failed: ' + data.message);
      }
    } catch (err) {
      alert('An error occurred during deletion');
      console.error(err);
    }
  };

  // Replace the local password check with a server API call
  const checkPassword = async (img, password) => {
    try {
      const res = await fetch(`http://localhost:5000/api/images/${img._id}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.valid;
      }
      return false;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const handleProtectedAction = (img, action) => {
    setPasswordModal({ open: true, img, action });
    setPasswordError('');
  };

  const handlePasswordSubmit = async (password) => {
    const { img, action } = passwordModal;
    const isValid = await checkPassword(img, password);
    
    if (!isValid) {
      setPasswordError('Incorrect password.');
      return;
    }
    
    setPasswordModal({ open: false, img: null, action: null });
    setPasswordError('');
    
    // Perform the action
    if (action === 'view') {
      window.open(`/view/${img._id}`, '_blank', 'noopener noreferrer');
    } else if (action === 'share') {
      const shareUrl = `${window.location.origin}/view/${img._id}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } else if (action === 'download') {
      window.open(`http://localhost:5000/api/images/serve/${img._id}`, '_blank', 'noopener noreferrer');
    }
  };


  return (
    <div className="dashboard-container">
      {/* Notification */}
      {notification && (
        <div className="notification">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="notification-close">×</button>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="user-info">
          <h2>Welcome, {user.name}! 👋</h2>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
        <div className="header-content">
          <h1 className="dashboard-title">Your Creative Dashboard</h1>
          <p className="dashboard-subtitle">Create, organize, and share your beautiful collages</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchImages} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={handleCreateCollage} className="btn btn-primary">
            <span className="btn-icon">+</span>
            Create New Collage
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'collages' ? 'active' : ''}`}
          onClick={() => setActiveTab('collages')}
        >
          Upload
          {/* ({images.length}) */}
        </button>
        <button
          className={`nav-tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          Protected ({images.filter(img => img.password).length})
        </button>
        <button
          className={`nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          All Collages ({images.length})
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Statistics Cards */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stat.value}</h3>
                    <p className="stat-title">{stat.title}</p>
                    <p className="stat-subtitle">{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Collages */}
            <div className="recent-section">
              <div className="section-header">
                <h2>Recent Collages</h2>
                <button className="btn btn-text" onClick={() => setActiveTab('favorites')}>View All</button>
              </div>
              <div className="recent-grid">
                {loading ? (
                  <Loader />
                ) :
                  images.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">🎨</div>
                      <h3>No Collages Yet</h3>
                      <p>Start by creating your first collage!</p>
                      <button onClick={handleCreateCollage} className="btn btn-primary">
                        Create Your First Collage
                      </button>
                    </div>
                  )
                }
                {images.slice(0, 4).map(img => (
                  <div key={img._id} className="recent-card">
                    <div className="recent-thumbnail">
                      <ProtectedImage
                        imageId={img._id}
                        isProtected={!!img.password}
                        alt="Uploaded collage"
                        src={img.filename}
                        className={img.password ? 'protected-blur' : ''}
                        style={{ cursor: img.password ? 'pointer' : 'default' }}
                        onClick={img.password ? () => handleProtectedAction(img, 'view') : undefined}
                      />
                      <div className="recent-overlay">
                        <div className="fab-menu">
                          <button
                            className="fab-action"
                            title="View Collage"
                            onClick={img.password ? () => handleProtectedAction(img, 'view') : () => window.open(`/view/${img._id}`, '_blank', 'noopener noreferrer')}
                          >
                            <span role="img" aria-label="View">👁️</span>
                          </button>
                          <button
                            className="fab-action"
                            title="Copy Share Link"
                            onClick={img.password ? () => handleProtectedAction(img, 'share') : () => {
                              const shareUrl = `${window.location.origin}/view/${img._id}`;
                              navigator.clipboard.writeText(shareUrl);
                              alert('Share link copied to clipboard!');
                            }}
                          >
                            <span role="img" aria-label="Copy Link">🔗</span>
                          </button>
                          <a
                            className="fab-action"
                            title="Download Image"
                            href={img.password ? undefined : `http://localhost:5000/api/images/serve/${img._id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={img.password ? (e) => { e.preventDefault(); handleProtectedAction(img, 'download'); } : undefined}
                          >
                            <span role="img" aria-label="Download">⬇️</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="recent-info">
                      <h4>Collage {img._id.slice(-6)}</h4>
                      <p>{new Date(img.createdAt).toLocaleDateString()}</p>
                      {img.password && <span className="password-badge">🔒 Protected</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="section-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="actions-grid">
                <button className="action-card" onClick={() => handleQuickAction('upload')}>
                  <div className="action-icon">📷</div>
                  <h3>Upload Photos</h3>
                  <p>Add new images to your collection</p>
                </button>
                <button className="action-card" onClick={() => handleQuickAction('create')}>
                  <div className="action-icon">🎨</div>
                  <h3>Create Collage</h3>
                  <p>Start a new collage project</p>
                </button>
                <button className="action-card" onClick={() => handleQuickAction('share')}>
                  <div className="action-icon">📤</div>
                  <h3>View Protected</h3>
                  <p>See your password-protected collages</p>
                </button>
                <button className="action-card" onClick={() => handleQuickAction('settings')}>
                  <div className="action-icon">⚙️</div>
                  <h3>Settings</h3>
                  <p>Customize your preferences</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collages' && (
          <div className="collages-content">
            <div className="collage-header">
              <h2>Upload & Create Collages</h2>
              <div className="search-filter-section">
                {/* <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search collages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div> */}
                <div className="collage-filters">
                  <button
                    className={`btn ${filterType === 'all' ? 'btn-outline active' : 'btn-outline'}`}
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </button>
                  <button
                    className={`btn ${filterType === 'protected' ? 'btn-outline active' : 'btn-outline'}`}
                    onClick={() => setFilterType('protected')}
                  >
                    Protected
                  </button>
                  <button
                    className={`btn ${filterType === 'public' ? 'btn-outline active' : 'btn-outline'}`}
                    onClick={() => setFilterType('public')}
                  >
                    Public
                  </button>
                </div>
              </div>
            </div>
            <Collage images={filteredImages} onRefresh={fetchImages} />
          </div>
        )}

        {activeTab === 'shared' && (
          <div className="shared-content">
            <div className="section-header">
              <h2>Protected Collages</h2>
              <p>Collages protected with passwords</p>
            </div>
            <div className="images-grid">
              {filteredImages.filter(img => img.password).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔒</div>
                  <h3>No Protected Collages</h3>
                  <p>Upload images and set passwords to see them here.</p>
                  <button onClick={handleCreateCollage} className="btn btn-primary">
                    Create Protected Collage
                  </button>
                </div>
              ) : (
                filteredImages.filter(img => img.password).map(img => (
                  <div key={img._id} className="image-card">
                    <div className="image-thumbnail">
                      <ProtectedImage
                        imageId={img._id}
                        isProtected={!!img.password}
                        alt="Protected collage"
                        className={img.password ? 'protected-blur' : ''}
                        style={{ cursor: img.password ? 'pointer' : 'default' }}
                        onClick={img.password ? () => handleProtectedAction(img, 'view') : undefined}
                      />
                      <div className="image-overlay">
                        <div className="fab-menu">
                          <button
                            className="fab-action"
                            title="View Collage"
                            onClick={img.password ? () => handleProtectedAction(img, 'view') : () => window.open(`/view/${img._id}`, '_blank', 'noopener noreferrer')}
                          >
                            <span role="img" aria-label="View">👁️</span>
                          </button>
                          <button
                            className="fab-action"
                            title="Copy Share Link"
                            onClick={img.password ? () => handleProtectedAction(img, 'share') : () => {
                              const shareUrl = `${window.location.origin}/view/${img._id}`;
                              navigator.clipboard.writeText(shareUrl);
                              alert('Share link copied to clipboard!');
                            }}
                          >
                            <span role="img" aria-label="Copy Link">🔗</span>
                          </button>
                          <a
                            className="fab-action"
                            title="Download Image"
                            href={img.password ? undefined : `http://localhost:5000/api/images/serve/${img._id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={img.password ? (e) => { e.preventDefault(); handleProtectedAction(img, 'download'); } : undefined}
                          >
                            <span role="img" aria-label="Download">⬇️</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="image-info">
                      <h4>Protected Collage</h4>
                      <p>{new Date(img.createdAt).toLocaleDateString()}</p>
                      <span className="password-badge">🔒 Protected</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-content">
            <div className="section-header">
              <h2>All Your Collages</h2>
              <p>All your uploaded collages in one place</p>
            </div>
            <div className="search-filter-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search collages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              <div className="collage-filters">
                <button
                  className={`btn ${filterType === 'all' ? 'btn-outline active' : 'btn-outline'}`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`btn ${filterType === 'protected' ? 'btn-outline active' : 'btn-outline'}`}
                  onClick={() => setFilterType('protected')}
                >
                  Protected
                </button>
                <button
                  className={`btn ${filterType === 'public' ? 'btn-outline active' : 'btn-outline'}`}
                  onClick={() => setFilterType('public')}
                >
                  Public
                </button>
              </div>
            </div>
            <div className="images-grid">
              {filteredImages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎨</div>
                  <h3>No Collages Found</h3>
                  <p>{searchTerm ? 'No collages match your search.' : 'Start by uploading your first collage!'}</p>
                  {!searchTerm && (
                    <button onClick={handleCreateCollage} className="btn btn-primary">
                      Create Your First Collage
                    </button>
                  )}
                </div>
              ) : (
                filteredImages.map(img => (
                  <div key={img._id} className="image-card">
                    <div className="image-thumbnail">
                      <ProtectedImage
                        imageId={img._id}
                        isProtected={!!img.password}
                        alt="Collage"
                        className={img.password ? 'protected-blur' : ''}
                        style={{ cursor: img.password ? 'pointer' : 'default' }}
                        onClick={img.password ? () => handleProtectedAction(img, 'view') : undefined}
                      />
                      <div className="image-overlay">
                        <div className="fab-menu">
                          <button
                            className="fab-action"
                            title="View Collage"
                            onClick={img.password ? () => handleProtectedAction(img, 'view') : () => window.open(`/view/${img._id}`, '_blank', 'noopener noreferrer')}
                          >
                            <span role="img" aria-label="View">👁️</span>
                          </button>
                          <button
                            className="fab-action"
                            title="Copy Share Link"
                            onClick={img.password ? () => handleProtectedAction(img, 'share') : () => {
                              const shareUrl = `${window.location.origin}/view/${img._id}`;
                              navigator.clipboard.writeText(shareUrl);
                              alert('Share link copied to clipboard!');
                            }}
                          >
                            <span role="img" aria-label="Copy Link">🔗</span>
                          </button>
                          <a
                            className="fab-action"
                            title="Download Image"
                            href={img.password ? undefined : `http://localhost:5000/api/images/serve/${img._id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={img.password ? (e) => { e.preventDefault(); handleProtectedAction(img, 'download'); } : undefined}
                          >
                            <span role="img" aria-label="Download">⬇️</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="image-info">
                      <h4>Collage {img._id.slice(-6)}</h4>
                      <p>{new Date(img.createdAt).toLocaleDateString()}</p>
                      {img.password && <span className="password-badge">🔒 Protected</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <PasswordModal open={passwordModal.open} onClose={() => setPasswordModal({ open: false, img: null, action: null })} onSubmit={handlePasswordSubmit} error={passwordError} />
    </div>
  );
}
