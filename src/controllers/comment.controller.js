import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  const video = await Video.findById(videoId);

  if (content === "") throw new ApiError(400, "All field is required...");
  if (!video) throw new ApiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId,
  });
  res.status(201).json(new ApiResponse(201, comment, "Comment created..."));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (content === "") throw new ApiError(400, "All field is required...");

  const comment = await Comment.findById(commentId);

  if (!comment) throw new ApiError(404, "Comment Not found...");

  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );

  res.status(202).json(new ApiResponse(202, updated, "Comment created..."));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment Not found...");
  await Comment.findByIdAndDelete(commentId);

  res.status(200).json(new ApiResponse(200, {}, "Comment deleted.."));
});

const getAllCommentOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const comment = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { username: 1, fullName: 1, avatar: 1, _id: 1 } },
        ],
      },
    },
    { $project: { __v: 0 } },
    { $unwind: "$owner" },
  ]);
  res.status(200).json(new ApiResponse(200, comment, "All comment fetched..."));
});

export { createComment, updateComment, deleteComment, getAllCommentOnVideo };
