import jwt from "jsonwebtoken";

const jwtCookieAuth = (req, res, next) => {
  // Read token from cookie instead of Authorization header
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {

    return res.status(401).json({ error: "Unauthorized Access" });
  }
};

export default jwtCookieAuth;
