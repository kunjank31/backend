import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getAllCommentOnVideo,
  updateComment,
} from "../controllers/comment.controller.js";

const router = new Router();

router.use(verifyJWT);

router.route("/:videoId").post(createComment).get(getAllCommentOnVideo)
router.route("/:commentId").patch(updateComment).delete(deleteComment);
export default router;
