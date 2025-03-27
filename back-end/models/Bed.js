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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Bed = mongoose.model('Bed', bedSchema);

export default Bed; 