import jwt from "jsonwebtoken";
require("dotenv").config();

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

const { SECRET, REFRESH_SECRET } = process.env;

// export const generateAccessToken = (id: number) => {
export const generateAccessToken = (user: User) => {
  return jwt.sign(user, SECRET!, { expiresIn: "15min" });
};

// export const generateRefreshToken = (id: number) => {
export const generateRefreshToken = (user: User) => {
  return jwt.sign(user, REFRESH_SECRET!, { expiresIn: "15d" });
};
