// Remove a bed (for bed manager)
router.delete("/:bedNumber", auth, checkRole("bedManager"), async (req, res) => {
  try {
    const { bedNumber } = req.params;
    
    console.log("Delete bed request received for bed number:", bedNumber);
    console.log("User role:", req.user.role);
    
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
