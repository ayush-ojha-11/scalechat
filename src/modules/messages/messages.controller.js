import { sendMessage, getMessages, syncMessages } from "./messages.service.js";

export async function createMessage(req, res, next) {
  try {
    const { content } = req.validated.body;

    const message = await sendMessage({
      conversationId: req.params.conversationId,
      senderId: req.user.id,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req, res, next) {
  try {
    const { limit, cursor, after } = req.validated.query;
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Incremental synchronization after reconnection
    if (after) {
      const result = await syncMessages({
        conversationId,
        userId,
        after,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
    // older message pagination
    const result = await getMessages({
      conversationId,
      userId,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
