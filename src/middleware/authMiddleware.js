import TokenManager from "../utils/TokenManager.js";

const authMiddleware = (req, res, next) => {
  try {
    const accessToken = TokenManager.getTokenFromHeaders(req);
    TokenManager.verifyAccessToken(accessToken);
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
