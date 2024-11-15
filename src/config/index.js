import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

export { PORT, NODE_ENV };
