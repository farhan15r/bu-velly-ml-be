import InvariantError from "../../exceptions/InvariantError.js";
import User from "../../models/User.js";
import TokenManager from "../../utils/TokenManager.js";

const postAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username) throw new InvariantError("Username cannot be empty");
    if (!password) throw new InvariantError("Password cannot be empty");

    const user = new User();
    await user.getByUsername(username);
    await user.comparePassword(password);

    const accessToken = TokenManager.generateAccessToken({
      username: user.username,
    });

    return res.json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export default { postAuth };
