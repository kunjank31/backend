import mongoose from "mongoose";
import fs from "fs";
import { Video } from "../models/video.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  uploadOnCloudinary,
  deleteOnCloudinary,
} from "../utils/index.js";

const getVideoPathAndResolutions = (quality, videoResolutions) => {
  const resolution = videoResolutions.reduce((acc, videoResolution) => {
    const size = videoResolution.url
      .split(
        "http://res.cloudinary.com/kunjankoiri/video/upload/ac_none,c_pad,h_"
      )[1]
      .split(",")[0];
    acc[`${size}p`] = videoResolution.url;
    return acc;
  }, {});
  return resolution[quality] || null;
};

const publishVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    videoFile,
    duration,
    thumbnail,
    views,
    isPublished,
    owner,
  } = req.body;
  if (
    [title, description, videoFile, thumbnail].some((items) => items === "")
  ) {
    throw new ApiError(400, "All fields are manadatory!!");
  }
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  const uploadOptions = {
    resource_type: "video",
    folder: "playHub",
    quality: "auto:best",
    eager: [
      {
        width: 4096,
        height: 2160,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 4K
      {
        width: 2560,
        height: 1440,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 2K
      {
        width: 1920,
        height: 1080,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 1080p
      {
        width: 1280,
        height: 720,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 720p
      {
        width: 854,
        height: 480,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 480p
      {
        width: 640,
        height: 360,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 360p
      {
        width: 426,
        height: 240,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 240p
      {
        width: 256,
        height: 144,
        crop: "pad",
        audio_codec: "none",
        quality: "auto:best",
      }, // 144p
    ],
    eager_async: true,
  };

  const videoUploadOnCloudinary = await uploadOnCloudinary(
    videoFilePath,
    uploadOptions
  );
  const thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnailPath);

  if (!videoUploadOnCloudinary && !thumbnailUploadOnCloudinary) {
    throw new ApiError(400, "All fields are required!!");
  }
  const format = videoUploadOnCloudinary.eager.map(
    ({ status, batch_id, ...rest }) => rest
  );
  const videoCreated = await Video.create({
    title,
    description,
    videoFile: {
      url: videoUploadOnCloudinary.url,
      playbackUrl: videoUploadOnCloudinary.playback_url,
      publicId: videoUploadOnCloudinary.public_id,
      format,
    },
    thumbnail: {
      url: thumbnailUploadOnCloudinary.url,
      publicId: thumbnailUploadOnCloudinary.public_id,
    },
    owner: req.user._id,
    duration: videoUploadOnCloudinary.duration,
    isPublished,
    views,
  });
  if (!videoCreated) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }
  return res.json(
    new ApiResponse(201, videoCreated, "Video is published sucessfully")
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  const videoData = await Video.findOne({ _id: videoId });
  if (!videoData) throw new ApiError(404, "Video is not found!!");
  if (videoData.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Video can't be modified");
  }
  await Video.findByIdAndUpdate(
    { _id: videoId },
    { $set: { title, description } },
    { new: true }
  );
  return res
    .status(202)
    .json(
      new ApiResponse(202, videoData, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoData = await Video.findById(videoId);
  if (!videoData) throw new ApiError(404, "Video is not found!!");
  if (videoData.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Video can't be deleted");
  }

  const video_delete_response = await deleteOnCloudinary(
    videoData.videoFile.publicId,
    "video"
  );

  const thumbnail_delete_response = await deleteOnCloudinary(
    videoData.thumbnail.publicId,
    "image"
  );
  if (
    video_delete_response.result !== "ok" ||
    video_delete_response.result === "not found"
  ) {
    throw new ApiError(500, "Something went wrong while deleting video");
  }
  if (
    thumbnail_delete_response.result !== "ok" ||
    thumbnail_delete_response.result === "unot fond"
  ) {
    throw new ApiError(500, "Something went wrong while deleting thumbnail");
  }
  await Video.findByIdAndDelete({ _id: videoId });

  return res.json(new ApiResponse(200, {}, "Video is deleted"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "publishedBy",
        pipeline: [
          { $project: { fullName: 1, email: 1, username: 1, avatar: 1 } },
        ],
      },
    },
    { $unwind: "$publishedBy" },
    { $project: { __v: 0 } },
  ]);
  return res.json(
    new ApiResponse(200, videos, "All videos sucessfully fetched")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "publishedBy",
        pipeline: [
          { $project: { fullName: 1, email: 1, username: 1, avatar: 1 } },
        ],
      },
    },
    { $unwind: "$publishedBy" },
    { $project: { __v: 0 } },
  ]);
  if (!video) {
    throw new ApiError(404, "Video is not found!!");
  }
  return res.json(new ApiResponse(200, video, "Video found!!"));
});

const tooglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoData = await Video.findOne({ _id: videoId });
  if (!videoData) throw new ApiError(404, "Video is not found!!");
  if (videoData.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Video can't be modified");
  }
  if (videoData.isPublished) {
    await Video.findByIdAndUpdate(
      { _id: videoId },
      { $set: { isPublished: false } },
      { new: true }
    );
    return res
      .status(202)
      .json(new ApiResponse(202, {}, "video is unpublished"));
  } else {
    await Video.findByIdAndUpdate(
      { _id: videoId },
      { $set: { isPublished: true } },
      { new: true }
    );
    return res.status(202).json(new ApiResponse(202, {}, "video is published"));
  }
});

const incrementVideoView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findOne({ _id: videoId });
  if (!video) throw new ApiError(404, "Video not found!!!");
  await video.findByIdAndUpdate(
    { _id: videoId },
    { $set: { views: views + 1 } },
    { new: true }
  );
  return res
    .status(202)
    .json(new ApiResponse(202, {}, "Video views increment"));
});

const videoPlay = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { range } = req.header;
  const { quality } = req.query;
  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!range) {
    throw new ApiError(400, "Requires Range header");
  }
  const videoPath = getVideoPathAndResolutions(
    quality || "720p",
    video.videoFile.format
  );
  const videoSize = fs.statSync("Chris-Do.mp4").size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

export {
  publishVideo,
  updateVideo,
  deleteVideo,
  getAllVideos,
  tooglePublishStatus,
  getVideoById,
  videoPlay,
  incrementVideoView,
};
