import NextAuth from "next-auth";

import { nextAuthOptions } from "@/lib/auth/auth.config";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
