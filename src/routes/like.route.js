import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  getTotalLikeOnComment,
  getTotalLikeOnTweet,
  getTotalLikeOnVideo,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = new Router();

router.use(verifyJWT);

router.route("/tweet/:tweetId").post(toggleTweetLike).get(getTotalLikeOnTweet);
router
  .route("/comment/:commentId")
  .post(toggleCommentLike)
  .get(getTotalLikeOnComment);
router.route("/video/:videoId").post(toggleVideoLike).get(getTotalLikeOnVideo);
router.route("/liked-video").get(getLikedVideos);

export default router;
