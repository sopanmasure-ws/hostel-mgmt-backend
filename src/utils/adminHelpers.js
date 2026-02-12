/**
 * Helper functions for admin operations
 */

/**
 * Check if user can access a specific hostel
 */
const canAccessHostel = (user, hostelId) => {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  if (!Array.isArray(user.hostelIds)) return false;
  return user.hostelIds.map((id) => id.toString()).includes(hostelId.toString());
};

/**
 * Validate password confirmation
 */
const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Calculate room statistics
 */
const calculateRoomStats = (rooms) => {
  const totalRooms = rooms.length;
  const emptyRooms = rooms.filter((r) => r.status === 'empty').length;
  const filledRooms = rooms.filter((r) => r.status === 'filled').length;
  const damagedRooms = rooms.filter((r) => r.status === 'damaged').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupied = rooms.reduce((sum, room) => sum + room.occupiedSpaces, 0);

  return {
    totalRooms,
    emptyRooms,
    filledRooms,
    damagedRooms,
    maintenanceRooms,
    totalCapacity,
    totalOccupied,
    availableSpaces: totalCapacity - totalOccupied,
  };
};

/**
 * Group rooms by floor for seat map
 */
const createSeatMap = (rooms) => {
  const seatMap = {};
  
  rooms.forEach((room) => {
    if (!seatMap[room.floor]) {
      seatMap[room.floor] = [];
    }
    seatMap[room.floor].push({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      occupiedSpaces: room.occupiedSpaces,
      status: room.status,
      assignedStudents: room.assignedStudents,
    });
  });

  return seatMap;
};

module.exports = {
  canAccessHostel,
  validatePasswordMatch,
  calculateRoomStats,
  createSeatMap,
};
