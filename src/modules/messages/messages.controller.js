import { sendMessage } from "./messages.service.js";

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
