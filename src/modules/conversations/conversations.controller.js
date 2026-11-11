import { createDirectConversation } from "./conversations.service.js";

export async function createDirect(req, res, next) {
  try {
    const conversation = await createDirectConversation({
      currentUserId: req.user.id,
      targetUserId: req.body.targetUserId,
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
