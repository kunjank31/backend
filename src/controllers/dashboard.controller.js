import { ApiResponse, asyncHandler } from "../utils/index.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user._id }).select(
    "-__v -videoFile -description"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Get all channel videos"));
});

const getChannelStats = asyncHandler(async (req, res) => {
  const video = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
    { $project: { views: 1, createdAt: 1 } },
    {
      $facet: {
        getYearWiseViews: [
          {
            $group: {
              _id: { $year: "$createdAt" },
              totalViews: { $sum: "$views" },
            },
          },
        ],
        getTotalChannelViews: [
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" },
            },
          },
        ],
        getTotalChannelVideos: [
          {
            $group: {
              _id: null,
              totalVideos: { $sum: 1 },
            },
          },
        ],
      },
    },
    { $unwind: "$getTotalChannelViews" },
    { $unwind: "$getTotalChannelVideos" },
  ]);

  const subscriber = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(req.user._id) } },
    { $project: { subscriber: 1, createdAt: 1 } },
    {
      $facet: {
        getYearWiseSubscribers: [
          {
            $group: {
              _id: { $year: "$createdAt" },
              totalSubscribers: { $sum: 1 },
            },
          },
        ],
        getTotalChannelSubscribers: [
          {
            $group: {
              _id: null,
              totalSubscribers: { $sum: 1 },
            },
          },
        ],
      },
    },
    { $unwind: "$getTotalChannelSubscribers" },
  ]);

  const like = await Like.aggregate([
    { $match: { video: { $exists: true } } },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $match: { "video.owner": new mongoose.Types.ObjectId(req.user._id) } },
    {
      $facet: {
        getTotalChannelLikes: [
          {
            $group: {
              _id: null,
              totalLike: { $sum: 1 },
            },
          },
        ],
      },
    },
    { $unwind: "$getTotalChannelLikes" },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...video[0], ...subscriber[0], ...like[0] },
        "Get Channel stats"
      )
    );
});

export { getChannelVideos, getChannelStats };
