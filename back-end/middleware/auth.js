import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "No authentication token, authorization denied" });
    }

    // Log token for debugging
    console.log("Received token:", token.substring(0, 10) + "...");

    // Check if it's the admin token
    if (token === "admin-token") {
      console.log("Using admin token");
      req.user = {
        _id: "admin",
        email: "admin@example.com",
        role: "bedManager" // Give admin proper role
      };
      return next();
    }

    // Otherwise verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log("User not found for token");
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    
    // Log role for debugging
    console.log("User role from DB:", user.role);
    
    // Check for role in header (override for testing)
    const roleHeader = req.header("X-User-Role");
    if (roleHeader) {
      console.log("Role override from header:", roleHeader);
      req.user.role = roleHeader;
    }
    
    console.log("Final user role:", req.user.role);
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

const checkRole = (role) => {
  return (req, res, next) => {
    try {
      console.log(`Checking role: required=${role}, user=${req.user?.role}`);
      
      if (!req.user) {
        console.log("No user in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (req.user.role !== role) {
        console.log(`Role mismatch: ${req.user.role} vs ${role}`);
        return res.status(403).json({ 
          message: `Access denied. Required role: ${role}` 
        });
      }
      
      console.log("Role check passed");
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Server error during role check" });
    }
  };
};

export { auth, checkRole }; 