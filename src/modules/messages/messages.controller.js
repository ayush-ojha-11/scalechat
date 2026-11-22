import { sendMessage, getMessages } from "./messages.service.js";

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
    const query = req.validated.query;

    const result = await getMessages({
      conversationId: req.params.conversationId,
      userId: req.user.id,
      limit: query.limit,
      cursor: query.cursor,
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
