import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await projectService.delete(id);
      setProjects(projects.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h1 className="card-header" style={{marginBottom: 0}}>Projects</h1>
          <Link to="/projects/new" className="btn btn-primary">
            ➕ New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div style={{textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📋</div>
            <h3 style={{color: '#666', marginBottom: '1rem'}}>No projects yet</h3>
            <p style={{color: '#999', marginBottom: '2rem'}}>
              Create your first cleanroom project to get started
            </p>
            <Link to="/projects/new" className="btn btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-2">
            {projects.map(project => (
              <div key={project.id} className="card" style={{marginBottom: 0}}>
                <div style={{marginBottom: '1rem'}}>
                  <h3 style={{color: '#333', marginBottom: '0.5rem'}}>{project.project_name}</h3>
                  <div style={{color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                    📍 {project.project_location}
                  </div>
                  <div style={{color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                    🔧 {project.zone_count} zones
                  </div>
                  <div style={{color: '#999', fontSize: '0.75rem'}}>
                    Created: {new Date(project.create_datetime).toLocaleDateString()}
                  </div>
                </div>

                <div className="action-buttons">
                  <Link to={`/projects/${project.id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                  {deleteConfirm === project.id ? (
                    <>
                      <button 
                        onClick={() => handleDelete(project.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        Confirm Delete
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)} 
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirm(project.id)} 
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
