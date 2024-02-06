import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import cluster from "cluster";
import os from "os";
dotenv.config({ path: "./.env" });

const port = process.env.PORT || 8000;
const numCpus = os.availableParallelism();

if (cluster.isPrimary) {
  for (let i = 0; i < numCpus; i++) {
    cluster.fork();
  }
  cluster.on("exit", () => {
    cluster.fork();
  });
} else {
  connectDB()
    .then(
      () => app.on("error", () => console.log("Connection not established!!")),
      app.listen(port, () => console.log("Server is running at ", port))
    )
    .catch((err) => console.error("MONGODB CONNECTION FAILED ", err));
}
