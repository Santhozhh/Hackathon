import mongoose from "mongoose";

const bedHistorySchema = new mongoose.Schema({
  bedNumber: {
    type: Number,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  allocatedAt: {
    type: Date,
    required: true
  },
  dischargedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  wardType: {
    type: String,
    enum: ['general', 'icu'],
    default: 'general'
  }
}, {
  timestamps: true
});

const BedHistory = mongoose.model("BedHistory", bedHistorySchema);

export default BedHistory; 