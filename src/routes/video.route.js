import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  incrementVideoView,
  publishVideo,
  tooglePublishStatus,
  updateVideo,
  videoPlay,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishVideo
  );
router
  .route("/:videoId")
  .get(getVideoById)
  .patch(verifyJWT, updateVideo)
  .delete(verifyJWT, deleteVideo);
router.route("/toggle/:videoId").patch(tooglePublishStatus);
router.route("/play/:videoId").get(videoPlay);
router.route("/:videoId/views").patch(verifyJWT, incrementVideoView);
export default router;
