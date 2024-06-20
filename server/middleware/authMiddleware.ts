import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { prisma } from "../config/db";

import { generateAccessToken } from "../config/util";

require("dotenv").config();

const { SECRET, REFRESH_SECRET } = process.env;

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let accessToken =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    console.log("Refresh Token:", req.cookies.refreshToken);
    console.log("Cookies:", req.cookies);

    const { id } = jwt.verify(accessToken, SECRET!) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: false,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    req.user = user;

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res
          .status(401)
          .json({ error: "Not authorised, no refresh token!" });
      }

      try {
        const { id } = jwt.verify(refreshToken, REFRESH_SECRET!) as JwtPayload;

        const user = await prisma.user.findFirst({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            password: false,
          },
        });

        if (!user) {
          return res.status(400).json({ error: "User not found" });
        }

        const newAccessToken = generateAccessToken(id);
        // res.setHeader("x-access-token", newAccessToken);

        req.headers.authorization = `Bearer ${newAccessToken}`;

        req.user = user;

        next();
      } catch (err) {
        console.error("Error:", err);
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    } else {
      console.error("Error:", err);
      return res.status(401).json({ error: "Not authorized" });
    }
  }
};
