import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.use(verifyJWT);

router.route("/").get(getUserTweet).post(createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
