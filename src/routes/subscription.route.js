import { Router } from "express";
import {
    getSubscribedChannel,
  getUserChannelSubscriber,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = new Router();
router.use(verifyJWT);

router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getUserChannelSubscriber);

router.route("/u/:subscriberId").get(getSubscribedChannel);

export default router;
