import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
} from "./auth.service.js";
export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await refreshAccessToken(req.body.refreshToken);
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await logoutUser(req.body.refreshToken);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}
