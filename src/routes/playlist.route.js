import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getUserPlaylistById,
  getUserPlaylists,
  removeVideoFromPlayList,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = new Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist).get(getUserPlaylists);

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlayList);

router
  .route("/:playlistId")
  .get(getUserPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

export default router;
