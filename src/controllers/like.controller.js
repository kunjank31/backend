import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "That tweet not found!!");
  const like = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: req.user._id }],
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.status(200).json(new ApiResponse(200, {}, "Tweet disliked!!"));
  }
  const likeCreate = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likeCreate, "You've liked this tweet"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "That comment not found!!");
  const like = await Like.findOne({
    $and: [{ comment: commentId }, { likedBy: req.user._id }],
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.status(200).json(new ApiResponse(200, {}, "comment disliked!!"));
  }
  const likeCreate = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likeCreate, "You've liked this comment!!"));
});

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "That video not found!!");
  const like = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: req.user._id }],
  });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.status(200).json(new ApiResponse(200, {}, "video disliked!!"));
  }
  const likeCreate = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likeCreate, "You've liked this video!!"));
});

const getTotalLikeOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const like = await Like.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    { $project: { likedBy: 1, video: 1 } },
    {
      $group: {
        _id: "$video",
        totalLike: { $sum: 1 },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, like[0], "All Like on Video"));
});

const getTotalLikeOnComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const like = await Like.aggregate([
    { $match: { comment: new mongoose.Types.ObjectId(commentId) } },
    { $project: { likedBy: 1, comment: 1 } },
    {
      $group: {
        _id: "$comment",
        totalLike: { $sum: 1 },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, like[0], "All Like on Video"));
});

const getTotalLikeOnTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const like = await Like.aggregate([
    { $match: { tweet: new mongoose.Types.ObjectId(tweetId) } },
    { $project: { likedBy: 1, tweet: 1 } },
    {
      $group: {
        _id: "$tweet",
        totalLike: { $sum: 1 },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, like[0], "All Like on Video"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const like = await Like.aggregate([
    { $match: { likedBy: new mongoose.Types.ObjectId(req.user._id) } },
    { $match: { video: { $exists: true } } },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: { videoFile: 0, __V: 0 },
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
    { $unwind: "$video" },
  ]);
  return res.status(200).json(new ApiResponse(200, like, "All liked video"));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getTotalLikeOnVideo,
  getTotalLikeOnTweet,
  getTotalLikeOnComment,
};
