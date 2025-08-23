import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ViewImage from './components/ViewImage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Dashboard />
                {/* <Collage /> */}
              </>
            </ProtectedRoute>
          }
        />

        {/* Public route to view protected image by ID */}
        <Route path="/view/:id" element={<ViewImage />} />
      </Routes>
    </Router>
  );
}

export default App;
