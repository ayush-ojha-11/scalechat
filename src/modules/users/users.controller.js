import { getCurrentUser } from "./users.service.js";

export async function getMe(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}
