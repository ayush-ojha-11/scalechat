import { registerUser } from "./auth.service.js";
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
