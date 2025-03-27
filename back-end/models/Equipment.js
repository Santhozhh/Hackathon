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

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment; 