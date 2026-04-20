import mongoose from "mongoose";

const globalForMongo = globalThis;

if (!globalForMongo.__spsMongo) {
  globalForMongo.__spsMongo = {
    conn: null,
    promise: null,
  };
}

export async function connectMongo() {
  if (globalForMongo.__spsMongo.conn) {
    return globalForMongo.__spsMongo.conn;
  }

  if (!globalForMongo.__spsMongo.promise) {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/student_success_predictor";

    globalForMongo.__spsMongo.promise = mongoose
      .connect(mongoUri, {
        autoIndex: true,
      })
      .then((instance) => instance);
  }

  globalForMongo.__spsMongo.conn = await globalForMongo.__spsMongo.promise;
  return globalForMongo.__spsMongo.conn;
}

export { mongoose };
