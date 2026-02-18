import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/api';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectService.getById(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container">
        <div className="card">
          <h2>Project not found</h2>
          <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{marginBottom: '1rem'}}>
        <Link to="/projects" className="btn btn-secondary btn-sm">← Back to Projects</Link>
      </div>

      <div className="card">
        <h1 className="card-header">{project.project_name}</h1>
        
        <div className="grid grid-3" style={{marginBottom: '2rem'}}>
          <div>
            <strong>Location:</strong><br />
            📍 {project.project_location}
          </div>
          <div>
            <strong>Customer:</strong><br />
            👤 {project.first_name} {project.last_name}
          </div>
          <div>
            <strong>Created:</strong><br />
            🗓️ {new Date(project.create_datetime).toLocaleDateString()}
          </div>
        </div>

        {project.peak_max_temp && (
          <div className="grid grid-3" style={{marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px'}}>
            <div>
              <strong>Peak Max Temp:</strong><br />
              🌡️ {project.peak_max_temp}°C
            </div>
            <div>
              <strong>Peak Min Temp:</strong><br />
              ❄️ {project.peak_min_temp}°C
            </div>
            <div>
              <strong>Outdoor Humidity:</strong><br />
              💧 {project.outdoor_humidity}%
            </div>
          </div>
        )}

        <h2 style={{marginTop: '2rem', marginBottom: '1rem'}}>Zones ({project.zones?.length || 0})</h2>

        {project.zones?.map((zone, zoneIndex) => (
          <div key={zone.id} className="card" style={{background: '#f8f9fa', marginBottom: '2rem'}}>
            <h3 style={{color: '#667eea', marginBottom: '1rem'}}>
              Zone {zoneIndex + 1}: {zone.zone_name}
            </h3>
            
            <div className="grid grid-3" style={{marginBottom: '1rem'}}>
              <div>
                <strong>Standard:</strong><br />
                {zone.standard}
              </div>
              <div>
                <strong>Classification:</strong><br />
                {zone.classification}
              </div>
              <div>
                <strong>ACPH Range:</strong><br />
                {zone.acph_min} - {zone.acph_max}
              </div>
              <div>
                <strong>System Type:</strong><br />
                {zone.system_type}
              </div>
            </div>

            <h4 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>Rooms ({zone.rooms?.length || 0})</h4>

            {zone.rooms?.map((room, roomIndex) => (
              <div key={room.id} className="card" style={{background: 'white', marginBottom: '1rem'}}>
                <h4 style={{marginBottom: '1rem'}}>Room {roomIndex + 1}: {room.room_name}</h4>

                <div className="grid grid-3" style={{marginBottom: '1rem'}}>
                  <div>
                    <strong>Dimensions:</strong><br />
                    {room.length_m}m × {room.width_m}m × {room.height_m}m
                  </div>
                  <div>
                    <strong>People:</strong><br />
                    👥 {room.people_count}
                  </div>
                  <div>
                    <strong>Equipment Load:</strong><br />
                    ⚡ {room.equipment_load_kw} kW
                  </div>
                  <div>
                    <strong>Temperature:</strong><br />
                    🌡️ {room.temp_required_c}°C
                  </div>
                  <div>
                    <strong>Humidity:</strong><br />
                    💧 {room.rh_required_percent}%
                  </div>
                </div>

                {room.area_sqm && (
                  <>
                    <h5 style={{marginTop: '1.5rem', marginBottom: '1rem', color: '#667eea'}}>
                      📊 Calculated Parameters
                    </h5>

                    <table className="table" style={{fontSize: '0.875rem'}}>
                      <tbody>
                        <tr>
                          <td><strong>Area</strong></td>
                          <td>{room.area_sqm} m²</td>
                          <td><strong>Volume</strong></td>
                          <td>{room.volume_cum} m³</td>
                        </tr>
                        <tr>
                          <td><strong>Room CFM</strong></td>
                          <td>{room.room_cfm}</td>
                          <td><strong>ACPH</strong></td>
                          <td>{room.acph}</td>
                        </tr>
                        <tr>
                          <td><strong>Fresh Air CFM</strong></td>
                          <td>{room.fresh_air_cfm}</td>
                          <td><strong>Exhaust CFM</strong></td>
                          <td>{room.exhaust_cfm}</td>
                        </tr>
                        <tr>
                          <td><strong>Resultant CFM</strong></td>
                          <td>{room.resultant_cfm}</td>
                          <td><strong>Terminal Supply</strong></td>
                          <td>{room.terminal_supply_sqft} sqft</td>
                        </tr>
                        <tr>
                          <td><strong>Cooling Load</strong></td>
                          <td>{room.cooling_load_tr} TR</td>
                          <td><strong>Room AC Load</strong></td>
                          <td>{room.room_ac_load_tr} TR</td>
                        </tr>
                        <tr>
                          <td><strong>AHU CFM</strong></td>
                          <td>{room.ahu_cfm}</td>
                          <td><strong>AHU Size</strong></td>
                          <td>{room.ahu_size}</td>
                        </tr>
                        <tr>
                          <td><strong>Static Pressure</strong></td>
                          <td>{room.static_pressure}</td>
                          <td><strong>Motor HP</strong></td>
                          <td>{room.motor_hp}</td>
                        </tr>
                        <tr>
                          <td><strong>Cooling Coil Rows</strong></td>
                          <td>{room.cooling_coil_rows}</td>
                          <td><strong>Filter Stages</strong></td>
                          <td>{room.filter_stages}</td>
                        </tr>
                        <tr>
                          <td><strong>Chilled Water GPM</strong></td>
                          <td>{room.chilled_water_gpm}</td>
                          <td><strong>Chilled Water L/s</strong></td>
                          <td>{room.chilled_water_lps}</td>
                        </tr>
                        <tr>
                          <td><strong>Flow Velocity</strong></td>
                          <td>{room.flow_velocity_ms} m/s</td>
                          <td><strong>Pipe Size</strong></td>
                          <td>{room.pipe_size_mm} mm</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetails;
