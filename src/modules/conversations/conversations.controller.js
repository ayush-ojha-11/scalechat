import {
  createDirectConversation,
  getUserConversations,
} from "./conversations.service.js";

export async function createDirect(req, res, next) {
  try {
    const conversation = await createDirectConversation({
      currentUserId: req.user.id,
      targetUserId: req.validated.body.targetUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listConversations(req, res, next) {
  try {
    const query = req.validated.query;
    const result = await getUserConversations({
      userId: req.user.id,
      limit: query.limit,
      cursor: query.cursor,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
