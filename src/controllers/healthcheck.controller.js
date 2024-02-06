import { ApiResponse, asyncHandler } from "../utils/index.js";

const healthcheck = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, "All is well!!!"));
});

export { healthcheck };
