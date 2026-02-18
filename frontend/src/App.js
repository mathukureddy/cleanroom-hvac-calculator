import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import ProjectList from './pages/ProjectList';
import ProjectWizard from './pages/ProjectWizard';
import ProjectDetails from './pages/ProjectDetails';

// Components
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Navbar /><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Navbar /><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Navbar /><CustomerManagement /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Navbar /><ProjectList /></PrivateRoute>} />
          <Route path="/projects/new" element={<PrivateRoute><Navbar /><ProjectWizard /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><Navbar /><ProjectDetails /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
