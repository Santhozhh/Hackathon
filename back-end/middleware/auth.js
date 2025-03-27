import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Special case for admin token
    if (token === 'admin-token') {
      // Create a virtual admin user
      req.user = {
        _id: 'admin',
        username: 'admin',
        role: req.header('X-User-Role') || 'bedManager' // Default to bedManager if no role specified
      };
      req.token = token;
      return next();
    }

    // Regular JWT token verification
    try {
      const decoded = jwt.verify(token, "hackathon_secret_key");
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "Authentication failed - User not found" });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ message: "Authentication failed - Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Authentication failed - " + error.message });
  }
};

export const checkRole = (role) => {
  return (req, res, next) => {
    console.log("Checking role:", req.user.role, "Expected role:", role);
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Access denied. Required role: ${role}, your role: ${req.user.role}` });
    }
    next();
  };
}; 