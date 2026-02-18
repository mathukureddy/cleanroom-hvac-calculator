const db = require('../config/database');

// Get all standards
exports.getAllStandards = async (req, res) => {
  try {
    const [standards] = await db.query('SELECT * FROM ROOM_STANDARDS ORDER BY standard');
    res.json(standards);
  } catch (error) {
    console.error('Get standards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get classifications by standard
exports.getClassificationsByStandard = async (req, res) => {
  try {
    const standardId = req.params.standardId;

    const [classifications] = await db.query(
      `SELECT c.*, rs.standard 
       FROM CLASSIFICATIONS c
       JOIN ROOM_STANDARDS rs ON c.standard_id = rs.id
       WHERE c.standard_id = ?
       ORDER BY c.acph_min`,
      [standardId]
    );

    res.json(classifications);
  } catch (error) {
    console.error('Get classifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all classifications
exports.getAllClassifications = async (req, res) => {
  try {
    const [classifications] = await db.query(
      `SELECT c.*, rs.standard 
       FROM CLASSIFICATIONS c
       JOIN ROOM_STANDARDS rs ON c.standard_id = rs.id
       ORDER BY rs.standard, c.acph_min`
    );

    res.json(classifications);
  } catch (error) {
    console.error('Get all classifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
