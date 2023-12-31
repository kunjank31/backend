import { Router } from "express";
import {
  changeUserAvatar,
  changeUserCover,
  currentPasswordChange,
  currentUser,
  getChannelDetails,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
// secured route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").patch(verifyJWT, currentPasswordChange);
router
  .route("/change-avatar")
  .patch(verifyJWT, upload.single("avatar"), changeUserAvatar);
router
  .route("/change-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), changeUserCover);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/current-user").get(verifyJWT, currentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/c/:username").get(verifyJWT, getChannelDetails);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
