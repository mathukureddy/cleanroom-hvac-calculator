import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService, standardService } from '../services/api';

const ProjectWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [standards, setStandards] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState({
    projectName: '',
    projectLocation: '',
    peakMaxTemp: 45,
    peakMinTemp: 0,
    outdoorHumidity: 85,
    zones: []
  });

  const [currentZone, setCurrentZone] = useState({
    zoneName: '',
    standardId: '',
    classificationId: '',
    systemType: 'Chilled Water',
    rooms: []
  });

  const [currentRoom, setCurrentRoom] = useState({
    roomName: '',
    length: '',
    width: '',
    height: 2.4,
    peopleCount: 0,
    equipmentLoad: 0,
    lighting: 1.75,
    infiltration: 2,
    freshAirRatio: 0.1,
    exhaustRatio: 0,
    tempRequired: 24,
    rhRequired: 50
  });

  useEffect(() => {
    loadStandards();
    loadClassifications();
  }, []);

  const loadStandards = async () => {
    try {
      const response = await standardService.getAll();
      setStandards(response.data);
    } catch (error) {
      console.error('Error loading standards:', error);
    }
  };

  const loadClassifications = async () => {
    try {
      const response = await standardService.getAllClassifications();
      setClassifications(response.data);
    } catch (error) {
      console.error('Error loading classifications:', error);
    }
  };

  const getClassificationsForStandard = (standardId) => {
    return classifications.filter(c => c.standard_id === parseInt(standardId));
  };

  const handleProjectChange = (e) => {
    setProjectData({
      ...projectData,
      [e.target.name]: e.target.value
    });
  };

  const handleZoneChange = (e) => {
    setCurrentZone({
      ...currentZone,
      [e.target.name]: e.target.value
    });
  };

  const handleRoomChange = (e) => {
    setCurrentRoom({
      ...currentRoom,
      [e.target.name]: e.target.value
    });
  };

  const addRoom = () => {
    if (!currentRoom.roomName || !currentRoom.length || !currentRoom.width) {
      alert('Please fill in room name, length, and width');
      return;
    }

    setCurrentZone({
      ...currentZone,
      rooms: [...currentZone.rooms, { ...currentRoom }]
    });

    // Reset room form
    setCurrentRoom({
      ...currentRoom,
      roomName: '',
      length: '',
      width: ''
    });
  };

  const removeRoom = (index) => {
    setCurrentZone({
      ...currentZone,
      rooms: currentZone.rooms.filter((_, i) => i !== index)
    });
  };

  const addZone = () => {
    if (!currentZone.zoneName || !currentZone.standardId || !currentZone.classificationId) {
      alert('Please fill in zone name, standard, and classification');
      return;
    }

    if (currentZone.rooms.length === 0) {
      alert('Please add at least one room to the zone');
      return;
    }

    const selectedClass = classifications.find(c => c.id === parseInt(currentZone.classificationId));
    
    setProjectData({
      ...projectData,
      zones: [...projectData.zones, { 
        ...currentZone, 
        acphMin: selectedClass?.acph_min,
        acphMax: selectedClass?.acph_max,
        classification: selectedClass?.classification
      }]
    });

    // Reset zone form
    setCurrentZone({
      zoneName: '',
      standardId: '',
      classificationId: '',
      systemType: 'Chilled Water',
      rooms: []
    });

    setStep(2); // Go back to zone selection
  };

  const removeZone = (index) => {
    setProjectData({
      ...projectData,
      zones: projectData.zones.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    if (projectData.zones.length === 0) {
      alert('Please add at least one zone with rooms');
      return;
    }

    setLoading(true);

    try {
      await projectService.create(projectData);
      alert('Project created successfully!');
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="card">
      <h2 className="card-header">Step 1: Project Information</h2>

      <div className="form-group">
        <label className="form-label">Project Name *</label>
        <input
          type="text"
          name="projectName"
          className="form-control"
          value={projectData.projectName}
          onChange={handleProjectChange}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Project Location *</label>
        <input
          type="text"
          name="projectLocation"
          className="form-control"
          value={projectData.projectLocation}
          onChange={handleProjectChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Peak Max Temperature (°C)</label>
          <input
            type="number"
            name="peakMaxTemp"
            className="form-control"
            value={projectData.peakMaxTemp}
            onChange={handleProjectChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Peak Min Temperature (°C)</label>
          <input
            type="number"
            name="peakMinTemp"
            className="form-control"
            value={projectData.peakMinTemp}
            onChange={handleProjectChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Outdoor Humidity (%)</label>
          <input
            type="number"
            name="outdoorHumidity"
            className="form-control"
            value={projectData.outdoorHumidity}
            onChange={handleProjectChange}
          />
        </div>
      </div>

      <button 
        onClick={() => setStep(2)} 
        className="btn btn-primary"
        disabled={!projectData.projectName || !projectData.projectLocation}
      >
        Next: Add Zones →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="card">
      <h2 className="card-header">Step 2: Add Zones</h2>

      <div className="form-group">
        <label className="form-label">Zone Name *</label>
        <input
          type="text"
          name="zoneName"
          className="form-control"
          value={currentZone.zoneName}
          onChange={handleZoneChange}
          placeholder="e.g., Production Area AHU-1"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Standard *</label>
          <select
            name="standardId"
            className="form-select"
            value={currentZone.standardId}
            onChange={handleZoneChange}
          >
            <option value="">Select Standard</option>
            {standards.map(std => (
              <option key={std.id} value={std.id}>{std.standard}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Classification *</label>
          <select
            name="classificationId"
            className="form-select"
            value={currentZone.classificationId}
            onChange={handleZoneChange}
            disabled={!currentZone.standardId}
          >
            <option value="">Select Classification</option>
            {getClassificationsForStandard(currentZone.standardId).map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.classification} (ACPH: {cls.acph_min}-{cls.acph_max})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">System Type *</label>
          <select
            name="systemType"
            className="form-select"
            value={currentZone.systemType}
            onChange={handleZoneChange}
          >
            <option value="Chilled Water">Chilled Water</option>
            <option value="DX">DX (Direct Expansion)</option>
            <option value="Ventilation">Ventilation</option>
          </select>
        </div>
      </div>

      <button onClick={() => setStep(3)} className="btn btn-primary" style={{marginBottom: '2rem'}}>
        Add Rooms to this Zone →
      </button>

      {projectData.zones.length > 0 && (
        <>
          <h3 style={{marginTop: '2rem', marginBottom: '1rem'}}>Added Zones ({projectData.zones.length})</h3>
          {projectData.zones.map((zone, index) => (
            <div key={index} className="card" style={{background: '#f8f9fa', marginBottom: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <div>
                  <h4>{zone.zoneName}</h4>
                  <p style={{color: '#666', margin: '0.5rem 0'}}>
                    {standards.find(s => s.id === parseInt(zone.standardId))?.standard} - {zone.classification}
                  </p>
                  <p style={{color: '#666', margin: 0}}>
                    {zone.rooms.length} room(s) | {zone.systemType}
                  </p>
                </div>
                <button onClick={() => removeZone(index)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button onClick={handleSubmit} className="btn btn-success" disabled={loading}>
            {loading ? 'Creating Project...' : '✓ Complete & Create Project'}
          </button>
        </>
      )}

      <button onClick={() => setStep(1)} className="btn btn-secondary" style={{marginLeft: '1rem'}}>
        ← Back
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="card">
      <h2 className="card-header">Step 3: Add Rooms to Zone "{currentZone.zoneName}"</h2>

      <div className="form-group">
        <label className="form-label">Room Name *</label>
        <input
          type="text"
          name="roomName"
          className="form-control"
          value={currentRoom.roomName}
          onChange={handleRoomChange}
          placeholder="e.g., Clean Room 1"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Length (m) *</label>
          <input
            type="number"
            step="0.1"
            name="length"
            className="form-control"
            value={currentRoom.length}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Width (m) *</label>
          <input
            type="number"
            step="0.1"
            name="width"
            className="form-control"
            value={currentRoom.width}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Height (m)</label>
          <input
            type="number"
            step="0.1"
            name="height"
            className="form-control"
            value={currentRoom.height}
            onChange={handleRoomChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">People Count</label>
          <input
            type="number"
            name="peopleCount"
            className="form-control"
            value={currentRoom.peopleCount}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Equipment Load (kW)</label>
          <input
            type="number"
            step="0.1"
            name="equipmentLoad"
            className="form-control"
            value={currentRoom.equipmentLoad}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lighting (W/sqft)</label>
          <input
            type="number"
            step="0.01"
            name="lighting"
            className="form-control"
            value={currentRoom.lighting}
            onChange={handleRoomChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Required Temp (°C)</label>
          <input
            type="number"
            step="0.1"
            name="tempRequired"
            className="form-control"
            value={currentRoom.tempRequired}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Required RH (%)</label>
          <input
            type="number"
            name="rhRequired"
            className="form-control"
            value={currentRoom.rhRequired}
            onChange={handleRoomChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Infiltration (/hr)</label>
          <input
            type="number"
            step="0.1"
            name="infiltration"
            className="form-control"
            value={currentRoom.infiltration}
            onChange={handleRoomChange}
          />
        </div>
      </div>

      <button onClick={addRoom} className="btn btn-primary" style={{marginBottom: '2rem'}}>
        ➕ Add Room
      </button>

      {currentZone.rooms.length > 0 && (
        <>
          <h3 style={{marginTop: '2rem', marginBottom: '1rem'}}>Rooms in this Zone ({currentZone.rooms.length})</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Dimensions (L×W×H)</th>
                <th>People</th>
                <th>Equipment (kW)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentZone.rooms.map((room, index) => (
                <tr key={index}>
                  <td>{room.roomName}</td>
                  <td>{room.length}m × {room.width}m × {room.height}m</td>
                  <td>{room.peopleCount}</td>
                  <td>{room.equipmentLoad}</td>
                  <td>
                    <button onClick={() => removeRoom(index)} className="btn btn-danger btn-sm">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addZone} className="btn btn-success">
            ✓ Complete Zone & Return
          </button>
        </>
      )}

      <button onClick={() => setStep(2)} className="btn btn-secondary" style={{marginLeft: '1rem'}}>
        ← Back (Zone will not be saved)
      </button>
    </div>
  );

  return (
    <div className="container">
      <div style={{marginBottom: '2rem'}}>
        <h1>Create New Project</h1>
        <div className="wizard-steps" style={{marginTop: '2rem'}}>
          <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Project Info</div>
          </div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Add Zones</div>
          </div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Add Rooms</div>
          </div>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default ProjectWizard;
