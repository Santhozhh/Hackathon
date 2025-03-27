import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values
    default: function() {
      // Generate a default serial number if none provided
      return `EQ-${Math.floor(100000 + Math.random() * 900000)}`;
    }
  },
  isInUse: {
    type: Boolean,
    default: false,
  },
  patientName: {
    type: String,
    default: null,
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove any existing indexes on serialNumber
equipmentSchema.index({ serialNumber: 1 }, { unique: true, sparse: true });

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment; 