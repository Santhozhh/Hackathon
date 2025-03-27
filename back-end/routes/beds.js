import express from "express";
import Bed from "../models/Bed.js";
import BedHistory from "../models/BedHistory.js";
import { auth, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Get all beds (with optional filter)
router.get("/", auth, async (req, res) => {
  try {
    console.log("GET /beds endpoint accessed by user:", req.user?._id, "with role:", req.user?.role);
    
    const beds = await Bed.find({});
    
    // Calculate stats
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(bed => bed.isOccupied && !bed.isUnderMaintenance).length;
    const maintenanceBeds = beds.filter(bed => bed.isUnderMaintenance).length;
    const availableBeds = totalBeds - occupiedBeds - maintenanceBeds;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    res.json({
      beds,
      stats: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: Math.round(occupancyRate)
      }
    });
  } catch (error) {
    console.error("Error in GET /beds:", error);
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
        isOccupied: false,
        isUnderMaintenance: false
      });
    }
    
    await Bed.insertMany(newBeds);
    
    res.status(201).json({ 
      message: `${count} new beds added successfully`,
      firstBedNumber: startNumber,
      lastBedNumber: startNumber + count - 1
    });
  } catch (error) {
    console.error("Error in POST /beds:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a bed (for bed manager)
router.delete("/:bedNumber", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { bedNumber } = req.params;
    
    console.log("Delete bed request received for bed number:", bedNumber);
    console.log("User role:", req.user?.role);
    
    // Validate bed number
    if (!bedNumber) {
      console.log("Bed number not provided");
      return res.status(400).json({ message: "Please provide a bed number" });
    }
    
    // Convert to number to ensure proper comparison
    const bedNumberInt = parseInt(bedNumber);
    if (isNaN(bedNumberInt)) {
      console.log("Invalid bed number format:", bedNumber);
      return res.status(400).json({ message: "Bed number must be a valid number" });
    }
    
    // Find the bed
    const bed = await Bed.findOne({ bedNumber: bedNumberInt });
    
    if (!bed) {
      console.log("Bed not found with number:", bedNumberInt);
      return res.status(404).json({ message: "Bed not found" });
    }
    
    console.log("Bed found:", bed);
    
    // Check if bed is occupied
    if (bed.isOccupied) {
      console.log("Cannot remove occupied bed:", bedNumberInt);
      return res.status(400).json({ 
        message: "Cannot remove an occupied bed. Please discharge the patient first." 
      });
    }
    
    // Check if bed is under maintenance
    if (bed.isUnderMaintenance) {
      console.log("Cannot remove bed under maintenance:", bedNumberInt);
      return res.status(400).json({ 
        message: "Cannot remove a bed under maintenance. Please return it from maintenance first." 
      });
    }
    
    // Delete the bed
    const result = await Bed.deleteOne({ _id: bed._id });
    console.log("Delete result:", result);
    
    res.json({
      message: `Bed ${bedNumber} has been removed from the system`,
      removedBed: bed
    });
  } catch (error) {
    console.error("Error removing bed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get bed allocation history
router.get("/history", auth, async (req, res) => {
  try {
    // Get all history records, including active and completed
    const history = await BedHistory.find({})
      .sort({ allocatedAt: -1 })
      .limit(100); // Limit to most recent 100 records
    
    res.json({ history });
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
    
    // Find first available bed that is not under maintenance
    const availableBed = await Bed.findOne({ 
      isOccupied: false,
      isUnderMaintenance: false 
    });
    
    if (!availableBed) {
      return res.status(400).json({ message: "No beds available" });
    }
    
    // Update bed status
    availableBed.isOccupied = true;
    availableBed.patientName = patientName;
    availableBed.allocatedAt = new Date();
    
    await availableBed.save();
    
    // Create history record
    await BedHistory.create({
      bedNumber: availableBed.bedNumber,
      patientName: patientName,
      allocatedAt: availableBed.allocatedAt,
      isActive: true
    });
    
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
    
    // Update history record
    const historyRecord = await BedHistory.findOne({ 
      bedNumber: bed.bedNumber, 
      patientName: patientName,
      isActive: true
    });
    
    if (historyRecord) {
      historyRecord.isActive = false;
      historyRecord.dischargedAt = new Date();
      await historyRecord.save();
    }
    
    res.json({
      message: `Patient ${patientName} discharged from bed ${bed.bedNumber}`,
      bed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Set a bed for maintenance (for bed manager)
router.post("/maintenance", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { bedNumber } = req.body;
    
    console.log("Set bed for maintenance request received for bed number:", bedNumber);
    console.log("User role:", req.user?.role);
    
    // Validate bed number
    if (!bedNumber && bedNumber !== 0) {
      console.log("Bed number not provided");
      return res.status(400).json({ message: "Please provide a bed number" });
    }
    
    // Convert to number to ensure proper comparison
    const bedNumberInt = parseInt(bedNumber);
    if (isNaN(bedNumberInt)) {
      console.log("Invalid bed number format:", bedNumber);
      return res.status(400).json({ message: "Bed number must be a valid number" });
    }
    
    // Find the bed
    const bed = await Bed.findOne({ bedNumber: bedNumberInt });
    
    if (!bed) {
      console.log("Bed not found with number:", bedNumberInt);
      return res.status(404).json({ message: "Bed not found" });
    }
    
    console.log("Bed found:", bed);
    
    // Check if bed is already under maintenance
    if (bed.isUnderMaintenance) {
      console.log("Bed is already under maintenance:", bedNumberInt);
      return res.status(400).json({ message: "Bed is already under maintenance" });
    }
    
    // If bed is occupied, we need to discharge the patient first
    if (bed.isOccupied) {
      console.log("Cannot set occupied bed for maintenance:", bedNumberInt);
      return res.status(400).json({ 
        message: "Cannot set an occupied bed for maintenance. Please discharge the patient first." 
      });
    }
    
    // Update bed status
    bed.isUnderMaintenance = true;
    bed.maintenanceStartTime = new Date();
    
    const result = await bed.save();
    console.log("Bed set to maintenance, result:", result);
    
    res.json({
      message: `Bed ${bedNumber} has been set for maintenance`,
      bed
    });
  } catch (error) {
    console.error("Error setting bed for maintenance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Return a bed from maintenance (for bed manager)
router.post("/return-from-maintenance", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { bedNumber } = req.body;
    
    console.log("Return bed from maintenance request received for bed number:", bedNumber);
    console.log("User role:", req.user?.role);
    
    // Validate bed number
    if (!bedNumber && bedNumber !== 0) {
      console.log("Bed number not provided");
      return res.status(400).json({ message: "Please provide a bed number" });
    }
    
    // Convert to number to ensure proper comparison
    const bedNumberInt = parseInt(bedNumber);
    if (isNaN(bedNumberInt)) {
      console.log("Invalid bed number format:", bedNumber);
      return res.status(400).json({ message: "Bed number must be a valid number" });
    }
    
    // Find the bed
    const bed = await Bed.findOne({ bedNumber: bedNumberInt });
    
    if (!bed) {
      console.log("Bed not found with number:", bedNumberInt);
      return res.status(404).json({ message: "Bed not found" });
    }
    
    console.log("Bed found:", bed);
    
    // Check if bed is under maintenance
    if (!bed.isUnderMaintenance) {
      console.log("Bed is not under maintenance:", bedNumberInt);
      return res.status(400).json({ message: "Bed is not under maintenance" });
    }
    
    // Update bed status
    bed.isUnderMaintenance = false;
    bed.maintenanceStartTime = null;
    
    const result = await bed.save();
    console.log("Bed returned from maintenance, result:", result);
    
    res.json({
      message: `Bed ${bedNumber} has been returned from maintenance`,
      bed
    });
  } catch (error) {
    console.error("Error returning bed from maintenance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
