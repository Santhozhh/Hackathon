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

// Middleware to check if user has required role
export const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    // Convert single role to array for consistent handling
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    const userRole = req.headers['x-user-role'];
    
    if (!userRole) {
      return res.status(403).json({ message: 'Role information missing' });
    }
    
    // Check if user's role matches any of the required roles
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: `You do not have permission to perform this action. Required roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

export { auth }; 