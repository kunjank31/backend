import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({ path: "./.env" });

const port = process.env.PORT || 8000;

connectDB()
  .then(
    () => app.on("error", () => console.log("Connection not established!!")),
    app.listen(port, () => console.log("Server is running at ", port))
  )
  .catch((err) => console.error("MONGODB CONNECTION FAILED ", err));
