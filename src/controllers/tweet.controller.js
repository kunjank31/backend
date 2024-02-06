import { asyncHandler, ApiError, ApiResponse } from "../utils/index.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (content === "") throw new ApiError(400, "All fields are required!!!");
  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });
  return res.status(201).json(new ApiResponse(201, tweet, "tweet published!"));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const tweet = await Tweet.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              _id: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    { $project: { __v: 0 } },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "All your tweet here!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const tweet = await Tweet.findById({ _id: tweetId });
  if (!tweet) throw new ApiError(404, "Tweet not found");
  const updated = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "tweet updated!!!"));
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById({ _id: tweetId });
  if (!tweet) throw new ApiError(404, "Tweet not found");
  await Tweet.findByIdAndDelete(tweetId);
  return res.status(200).json(new ApiResponse(200, "tweet deleted!!!"));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
