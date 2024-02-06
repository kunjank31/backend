import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (name === "" || description === "") {
    throw new ApiError(400, "All fields are required!");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created..."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playList = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);
  if (!playList) throw new ApiError(404, "PlayList not found");
  if (!video) throw new ApiError(404, "video not found!!");
  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );
  return res.status(200).json(new ApiResponse(200, addVideo, "Video Added..."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;
  if (name === "" || description === "") {
    throw new ApiError(400, "All fields are required!");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(400, "Playlist not found!!");
  const playlistUpdated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: { name, description } },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlistUpdated, "Playlist updated!!"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(400, "Playlist not found!!");
  await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist has been deleted!!"));
});

const removeVideoFromPlayList = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);
  if (!playlist) throw new ApiError(400, "Playlist not found!!");
  if (!video) throw new ApiError(400, "video not found!!");
  const playlistUpdated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistUpdated, "Video removed from playlist!!")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { name: 1, fullName: 1, avatar: 1, _id: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: { __v: 0, videoFile: 0 },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: { name: 1, fullName: 1, avatar: 1, _id: 1 },
                },
              ],
            },
          },
          { $unwind: "$owner" },
        ],
      },
    },
    { $unwind: "$owner" },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "All playlist fetched"));
});

const getUserPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { name: 1, fullName: 1, avatar: 1, _id: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: { __v: 0, videoFile: 0 },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: { name: 1, fullName: 1, avatar: 1, _id: 1 },
                },
              ],
            },
          },
          { $unwind: "$owner" },
        ],
      },
    },
    { $unwind: "$owner" },
  ]);
  if (!playlist) throw new ApiError(400, "Playlist not found!!");
  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "One Playlist found"));
});

export {
  createPlaylist,
  addVideoToPlaylist,
  updatePlaylist,
  deletePlaylist,
  getUserPlaylists,
  getUserPlaylistById,
  removeVideoFromPlayList,
};
