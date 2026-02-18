import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await customerService.update(editingId, formData);
      } else {
        await customerService.create(formData);
      }
      
      resetForm();
      loadCustomers();
      alert('Customer saved successfully!');
    } catch (error) {
      alert('Error saving customer: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      username: customer.username,
      password: ''
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await customerService.delete(id);
      loadCustomers();
      alert('Customer deleted successfully!');
    } catch (error) {
      alert('Error deleting customer: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      username: '',
      password: ''
    });
    setEditingId(null);
    setShowForm(false);
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
          <h1 className="card-header" style={{marginBottom: 0}}>Customer Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : '➕ Add Customer'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{background: '#f8f9fa', marginBottom: '2rem'}}>
            <h3 style={{marginBottom: '1.5rem'}}>
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {!editingId && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="action-buttons">
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update Customer' : 'Create Customer'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.first_name} {customer.last_name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.username}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    background: customer.role === 'admin' ? '#667eea' : '#6c757d',
                    color: 'white'
                  }}>
                    {customer.role}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(customer)} 
                      className="btn btn-primary btn-sm"
                      disabled={customer.role === 'admin' && customer.email === 'admin@cleanroom.com'}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)} 
                      className="btn btn-danger btn-sm"
                      disabled={customer.role === 'admin' && customer.email === 'admin@cleanroom.com'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagement;
