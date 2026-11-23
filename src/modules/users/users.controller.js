import {
  getCurrentUser,
  searchUsers,
  getPublicUserProfile,
} from "./users.service.js";

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

export async function searchUsersController(req, res, next) {
  try {
    const { q, limit } = req.validated.query;

    const users = await searchUsers({
      query: q,
      limit,
      currentUserId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicUserProfileController(req, res, next) {
  try {
    const { userId } = req.validated.params;

    const user = await getPublicUserProfile(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
