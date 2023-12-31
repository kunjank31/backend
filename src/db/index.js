import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connectDB = async () => {
  try {
    const connectionString = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      "MONGODB CONNECTED!!! DB HOST :",
      connectionString.connection.host
    );
  } catch (error) {
    console.log("MONGODB CONNECTION FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
