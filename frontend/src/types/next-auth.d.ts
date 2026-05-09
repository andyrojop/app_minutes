import "next-auth";
import "next-auth/jwt";

type AuthError = "RefreshAccessTokenError" | "TokenExpired";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: AuthError;
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: AuthError;
  }
}
