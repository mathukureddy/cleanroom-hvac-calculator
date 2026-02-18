import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data.slice(0, 5)); // Show only recent 5
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="card-header">
          Welcome, {user?.firstName} {user?.lastName}! 👋
        </h1>
        <p style={{color: '#666', marginBottom: '2rem'}}>
          {user?.role === 'admin' 
            ? 'You have admin access to manage customers and all projects.' 
            : 'Start creating cleanroom HVAC calculation projects.'}
        </p>

        <div className="grid grid-2" style={{marginBottom: '2rem'}}>
          <Link to="/projects/new" className="card" style={{textDecoration: 'none', textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>➕</div>
            <h3 style={{color: '#667eea'}}>New Project</h3>
            <p style={{color: '#666'}}>Create a new cleanroom project</p>
          </Link>

          <Link to="/projects" className="card" style={{textDecoration: 'none', textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📊</div>
            <h3 style={{color: '#667eea'}}>View Projects</h3>
            <p style={{color: '#666'}}>Browse all your projects</p>
          </Link>
        </div>

        {user?.role === 'admin' && (
          <Link to="/customers" className="card" style={{textDecoration: 'none', textAlign: 'center', padding: '2rem', marginBottom: '2rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>👥</div>
            <h3 style={{color: '#667eea'}}>Manage Customers</h3>
            <p style={{color: '#666'}}>Add and manage customer accounts</p>
          </Link>
        )}
      </div>

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 className="card-header" style={{marginBottom: 0}}>Recent Projects</h2>
          <Link to="/projects" className="btn btn-primary btn-sm">View All</Link>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : projects.length === 0 ? (
          <p style={{color: '#666', textAlign: 'center', padding: '2rem'}}>
            No projects yet. Create your first project to get started!
          </p>
        ) : (
          <div className="grid grid-2">
            {projects.map(project => (
              <Link 
                key={project.id} 
                to={`/projects/${project.id}`} 
                className="project-card"
                style={{textDecoration: 'none'}}
              >
                <div className="project-card-title">{project.project_name}</div>
                <div className="project-card-info">📍 {project.project_location}</div>
                <div className="project-card-info">🔧 {project.zone_count} zones</div>
                <div className="project-card-info" style={{fontSize: '0.875rem', color: '#999'}}>
                  Created: {new Date(project.create_datetime).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
