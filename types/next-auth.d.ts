import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

// if you want to add more fields to the user
interface IUser extends DefaultUser {
  /**
   * Role of user
   */
  //   role?: Role
  /**
   * more fields
   */
  // phone?: string | null
  username?: string | null;
  name?: string | null;
  email?: string | null;
  role?: number;
  accessToken?: string;
}

declare module 'next-auth' {
  // type UserSession = DefaultSession['user'];
  interface User extends IUser {}
  // interface Session {
  //   user: UserSession;
  // }

  // interface CredentialsInputs {
  //   email: string;
  //   password: string;
  // }
  interface Session {
    user: IUser & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends IUser {}
}
