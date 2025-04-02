const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authToken = async (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  console.log("Cookies received:", req.cookies);
console.log("Token from cookies:", req.cookies.token);

  // Check if no token
  if (!token) {
    return res.status(401).json({
      message: 'Not authenticated, authorization denied',
      error: true,
      success: false
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    
    // Add user ID from token
    req.userId = decoded.userId;
    
    // Fetch user to get role
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid user',
        error: true,
        success: false
      });
    }
    
    // Add user role and branch for access control
    req.userRole = user.role;
    req.userBranch = user.branch;
    req.user = user;
    
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Token is not valid',
      error: true,
      success: false
    });
  }
};

module.exports = authToken;