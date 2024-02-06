import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found!!!");
  }
  if (channel._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You can't subscribe own channel");
  }
  const subscription = await Subscription.findOne({
    $and: [{ subscriber: req.user._id }, { channel: channelId }],
  });
  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
    return res.json(
      new ApiResponse(
        202,
        {},
        "unsubscribed, You've missed the great oppertunity!!!"
      )
    );
  }
  const subscribed = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });
  return res.json(
    new ApiResponse(201, subscribed, "Thank you for subscribed us!")
  );
});

const getUserChannelSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscribers = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          { $project: { username: 1, _id: 1, fullName: 1, avatar: 1 } },
        ],
      },
    },
    { $unwind: "$subscriber" },
    {
      $group: {
        _id: { $year: "$createdAt" },
        totalSubscribers: { $push: "$subscriber" },
      },
    },
  ]);
  return res.json(new ApiResponse(200, subscribers, "All subscribers"));
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const subscribedChannel = await Subscription.aggregate([
    { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
    { $project: { channel: 1, _id: 0 } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          { $project: { username: 1, _id: 1, fullName: 1, avatar: 1 } },
        ],
      },
    },
    { $unwind: "$channel" },
    {
      $group: {
        _id: "null",
        totalChannel: { $push: "$channel" },
      },
    },
  ]);
  return res.json(
    new ApiResponse(200, subscribedChannel, "All Channel fetched successfully")
  );
});

export { toggleSubscription, getUserChannelSubscriber, getSubscribedChannel };
