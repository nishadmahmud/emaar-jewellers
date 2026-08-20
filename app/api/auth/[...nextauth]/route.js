import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOption = {
  secret: process.env.NEXTAUTH_SECRET || "dummy-secret-for-presentation",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API || "https://www.outletexpense.xyz/api";
          const res = await fetch(`${apiUrl}/user-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error("API returned non-JSON:", text.substring(0, 200));
            throw new Error("API did not return JSON. Check server logs.");
          }

          if (!res.ok) {
            throw new Error(data.message || data.error || "Invalid credentials");
          }

          const employee = data?.employee || null;
          const employeeDetails = employee
            ? {
                id: employee.id,
                employee_id: employee.employee_id,
                name: employee.name,
                email: employee.email,
                mobile_number: employee.mobile_number,
                warehouse_id: employee.warehouse_id,
                role_id: employee.role_id,
                role: {
                  id: employee.role?.id,
                  name: employee.role?.name,
                },
              }
            : null;

          // Return user object formatted for NextAuth based on backend response
          return {
            id: data.user?.id || data.id || "1",
            name: data.user?.name || data.name || "User",
            outlet_name: data.user?.outlet_name || data.outlet_name || "",
            email: data.user?.email || data.email || credentials.email,
            accessToken: data.authorisation?.token || data.token || data.access_token || data.jwt || null,
            pinVerified: false,
            isEmployee: !!employee,
            employeeId: employee?.id || null,
            employee: employeeDetails,
          };
        } catch (error) {
          throw new Error(error.message || "Failed to authenticate");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.pinVerified = user.pinVerified;
        token.user = user;
        token.isEmployee = user.isEmployee;
        token.employeeId = user.employeeId;
        token.employee = user.employee;
      }
      if (trigger === "update" && session) {
        if (session.pinVerified !== undefined) {
          token.pinVerified = session.pinVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.pinVerified = token.pinVerified;
      session.user = token.user;
      session.isEmployee = token.isEmployee;
      session.employeeId = token.employeeId;
      session.employee = token.employee;
      return session;
    },
  },
};

const handler = NextAuth(authOption);
export { handler as GET, handler as POST };
