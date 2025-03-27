import express from "express";
import Bed from "../models/Bed.js";
import { auth, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Get all beds (with optional filter)
router.get("/", auth, async (req, res) => {
  try {
    const beds = await Bed.find({});
    
    // Calculate stats
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(bed => bed.isOccupied).length;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    res.json({
      beds,
      stats: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: Math.round(occupancyRate)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new beds (for bed manager)
router.post("/", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || count <= 0) {
      return res.status(400).json({ message: "Please provide a valid bed count" });
    }
    
    // Find the highest bed number
    const highestBed = await Bed.findOne().sort({ bedNumber: -1 });
    let startNumber = highestBed ? highestBed.bedNumber + 1 : 1;
    
    const newBeds = [];
    
    // Create the specified number of beds
    for (let i = 0; i < count; i++) {
      newBeds.push({
        bedNumber: startNumber + i,
        isOccupied: false
      });
    }
    
    await Bed.insertMany(newBeds);
    
    res.status(201).json({ 
      message: `${count} new beds added successfully`,
      firstBedNumber: startNumber,
      lastBedNumber: startNumber + count - 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Allocate a bed to a patient (for bed manager)
router.post("/allocate", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { patientName } = req.body;
    
    if (!patientName) {
      return res.status(400).json({ message: "Please provide a patient name" });
    }
    
    // Find first available bed
    const availableBed = await Bed.findOne({ isOccupied: false });
    
    if (!availableBed) {
      return res.status(400).json({ message: "No beds available" });
    }
    
    // Update bed status
    availableBed.isOccupied = true;
    availableBed.patientName = patientName;
    availableBed.allocatedAt = new Date();
    
    await availableBed.save();
    
    res.json({
      message: `Bed ${availableBed.bedNumber} allocated to ${patientName}`,
      bed: availableBed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Discharge a patient from a bed (for bed manager)
router.post("/discharge", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { patientName } = req.body;
    
    if (!patientName) {
      return res.status(400).json({ message: "Please provide a patient name" });
    }
    
    // Find the bed with this patient
    const bed = await Bed.findOne({ patientName, isOccupied: true });
    
    if (!bed) {
      return res.status(404).json({ message: "No allocated bed found for this patient" });
    }
    
    // Update bed status
    bed.isOccupied = false;
    bed.patientName = null;
    bed.allocatedAt = null;
    
    await bed.save();
    
    res.json({
      message: `Patient ${patientName} discharged from bed ${bed.bedNumber}`,
      bed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 