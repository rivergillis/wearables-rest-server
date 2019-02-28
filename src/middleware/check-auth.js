import jwt from "jsonwebtoken";

// Authorizes using 'Authorization:Bearer [token]' in the headers
// Place this middleware before a controller to require auth for the controller
// This will give access to req.userData which includes email and userId
const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userData = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: "Auth failed" } });
  }
};

export default checkAuth;
