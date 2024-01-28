import User from "../../models/User.js";

const postUsers = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });

    await user.isUsernameExist();
    await user.save();

    res.status(201).json({
      status: "success",
      message: "User created",
    });
  } catch (error) {
    next(error);
  }
};

export default { postUsers };
