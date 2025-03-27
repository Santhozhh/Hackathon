import express from "express";
import Equipment from "../models/Equipment.js";
import { auth, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Get all equipment (with optional filter)
router.get("/", auth, async (req, res) => {
  try {
    const equipment = await Equipment.find({});
    
    // Calculate stats
    const totalEquipment = equipment.length;
    const inUseEquipment = equipment.filter(eq => eq.isInUse).length;
    const availableEquipment = totalEquipment - inUseEquipment;
    const usageRate = totalEquipment > 0 ? (inUseEquipment / totalEquipment) * 100 : 0;
    
    res.json({
      equipment,
      stats: {
        totalEquipment,
        inUseEquipment,
        availableEquipment,
        usageRate: Math.round(usageRate)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new equipment (for equipment manager)
router.post("/", auth, checkRole(["equipmentManager", "bedManager"]), async (req, res) => {
  try {
    const { name, type, serialNumber } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ message: "Please provide equipment name and type" });
    }
    
    // Check if equipment with same serial number already exists
    if (serialNumber) {
      const existingEquipment = await Equipment.findOne({ serialNumber });
      if (existingEquipment) {
        return res.status(400).json({ 
          message: `Equipment with serial number ${serialNumber} already exists` 
        });
      }
    }
    
    const newEquipment = new Equipment({
      name,
      type,
      serialNumber, // Will use the default generator if not provided
      isInUse: false
    });
    
    await newEquipment.save();
    
    res.status(201).json({ 
      message: `New equipment added successfully`,
      equipment: newEquipment
    });
  } catch (error) {
    console.error("Error adding equipment:", error);
    
    // Handle MongoDB duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Duplicate equipment serial number. Please use a unique serial number."
      });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Assign equipment to a patient (for equipment manager)
router.post("/assign", auth, checkRole(["equipmentManager", "bedManager"]), async (req, res) => {
  try {
    const { equipmentId, patientName } = req.body;
    
    if (!equipmentId || !patientName) {
      return res.status(400).json({ message: "Please provide equipment ID and patient name" });
    }
    
    // Find the equipment
    const equipment = await Equipment.findById(equipmentId);
    
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    
    if (equipment.isInUse) {
      return res.status(400).json({ message: "Equipment already in use" });
    }
    
    // Update equipment status
    equipment.isInUse = true;
    equipment.patientName = patientName;
    equipment.assignedAt = new Date();
    
    await equipment.save();
    
    res.json({
      message: `${equipment.name} assigned to ${patientName}`,
      equipment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Return equipment from a patient (for equipment manager)
router.post("/return", auth, checkRole(["equipmentManager", "bedManager"]), async (req, res) => {
  try {
    const { equipmentId } = req.body;
    
    if (!equipmentId) {
      return res.status(400).json({ message: "Please provide equipment ID" });
    }
    
    // Find the equipment
    const equipment = await Equipment.findById(equipmentId);
    
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    
    if (!equipment.isInUse) {
      return res.status(400).json({ message: "Equipment is not currently in use" });
    }
    
    const patientName = equipment.patientName;
    
    // Update equipment status
    equipment.isInUse = false;
    equipment.patientName = null;
    equipment.assignedAt = null;
    
    await equipment.save();
    
    res.json({
      message: `${equipment.name} returned from ${patientName}`,
      equipment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get equipment by patient
router.get("/by-patient/:patientName", auth, async (req, res) => {
  try {
    const { patientName } = req.params;
    
    if (!patientName) {
      return res.status(400).json({ message: "Please provide a patient name" });
    }
    
    const equipment = await Equipment.find({ patientName });
    
    res.json({
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 