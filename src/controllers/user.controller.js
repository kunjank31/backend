import {
  ApiError,
  ApiResponse,
  asyncHandler,
  // uploadOnCloudinary,
} from "../utils/index.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) throw new ApiError(401, "User not found!!");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message || "Internal Server Error");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get data from user
  // validate the data
  // check into db
  // files validate
  // upload on cloudniary
  // create object
  // send response to fronted

  const { fullName, email, username, password } = req.body;
  if ([fullName, email, username, password].some((items) => items === "")) {
    throw new ApiError(400, "All fields are required!");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(400, "user already registered with username or email!");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let converImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    converImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "All fields are required!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(converImageLocalPath);
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "All fields are manadotry!!");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(401, "User not found!!");
  }

  const verifyPassword = await user.comparePassword(password);
  if (!verifyPassword) {
    throw new ApiError(400, "Wrong Credentials!");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -__v"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { ...loggedInUser._doc, refreshToken },
        "User logged in successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { refreshToken: null } },
    { new: true }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "Logged out successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken =
      req.cookies?.refreshToken ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.body.refreshToken;

    if (!incomingToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id).select(
      "-password -__v"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Refresh token");
    }
    if (incomingToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshToken(user._id);

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const currentPasswordChange = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "All fields are manadotary!!");
  }
  const user = await User.findById(req.user?._id);
  const verifyPassword = await user.comparePassword(oldPassword);

  if (!verifyPassword) {
    throw new ApiError(400, "Password is incorrect!!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(202)
    .json(new ApiResponse(202, {}, "Password has been changed."));
});

const changeUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const publicId = req.user?.avatar
    .replace("http://res.cloudinary.com/kunjankoiri/image/upload/", "")
    .split("/")[1]
    .split(".")[0];
  const { result } = await deleteOnCloudinary(publicId);
  if (result !== "ok") {
    throw new ApiError(400, "Error while deleting old avatar");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -__v");
  return res
    .status(202)
    .json(new ApiResponse(202, user, "Avatar image is successfully updated"));
});

const changeUserCover = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }
  const publicId = req.user?.avatar
    .replace("http://res.cloudinary.com/kunjankoiri/image/upload/", "")
    .split("/")[1]
    .split(".")[0];
  const { result } = await deleteOnCloudinary(publicId);
  if (result !== "ok") {
    throw new ApiError(400, "Error while deleting old cover image");
  }
  const cover = await uploadOnCloudinary(coverLocalPath);
  if (!cover.url) {
    throw new ApiError(400, "Error while uploading on cover");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: cover.url } },
    { new: true }
  ).select("-password -__v");
  return res
    .status(202)
    .json(new ApiResponse(202, user, "cover image is successfully updated"));
});

const currentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current User"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!!");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { email, fullName } },
    { new: true }
  ).select("-password -__v");
  return res
    .status(202)
    .json(new ApiResponse(202, user, "Account details updated successfully"));
});

const getChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing!!");
  }
  const channel = await User.aggregate([
    { $match: { username } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber_details",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscriber_details",
        },
        subscribedChannelCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscriber_details.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        password: 0,
        __v: 0,
        refreshToken: 0,
        updatedAt: 0,
        watchHistory: 0,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "Channel Not Found!!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              $first: {
                owner: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history has been fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  currentPasswordChange,
  changeUserAvatar,
  logoutUser,
  changeUserCover,
  refreshAccessToken,
  currentUser,
  updateAccountDetails,
  getChannelDetails,
  getWatchHistory,
};
