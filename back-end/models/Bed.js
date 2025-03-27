import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  isOccupied: {
    type: Boolean,
    default: false,
  },
  patientName: {
    type: String,
    default: null,
  },
  allocatedAt: {
    type: Date,
    default: null,
  },
  isUnderMaintenance: {
    type: Boolean,
    default: false,
  },
  maintenanceStartTime: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Bed = mongoose.model('Bed', bedSchema);

export default Bed; 