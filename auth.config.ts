import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { cookies } from 'next/headers';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        // email: {
        //   type: 'email'
        // },
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: {
          type: 'password'
        }
      },
      async authorize(credentials, req) {
        // console.log('credentials', credentials);
        const { username, password } = credentials;
        const params = {
          username,
          password
        };
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + '/api/user/login',
          {
            method: 'POST',
            body: JSON.stringify(params),
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const userLogin = await res.json();
        console.log('----userLogin----', userLogin);
        if (!userLogin?.success) return null;
        // console.log('userLogin', userLogin)
        // console.log('res', res.json())
        // console.log('---res.headers---', res.headers)
        // console.log("---res.headers.get('set-cookie')---", res.headers.get('set-cookie'))
        const apiCookies = res.headers.get('set-cookie')?.split(';');
        let _session = '';
        let _path = '';
        let _expires = '';
        let _maxAge = '';
        apiCookies &&
          apiCookies.forEach((item) => {
            if (item.includes('session')) {
              _session = item.split('=')[1];
            }
            if (item.includes('Path')) {
              _path = item.split('=')[1];
            }
            if (item.includes('Expires')) {
              _expires = item.split('=')[1];
            }
            if (item.includes('Max-Age')) {
              _maxAge = item.split('=')[1];
            }
          });
        // console.log(_session, _path, _expires, _maxAge)
        // console.log('---cookies---', cookies())
        cookies().set({
          name: 'session',
          value: _session,
          httpOnly: true,
          path: '/'
        });
        // 设置角色
        cookies().set({
          name: 'role',
          value: userLogin.data.role,
          httpOnly: true,
          path: '/'
        });
        // const loginData = await res.json()
        // console.log('loginData', loginData)
        const user = {
          // id: '1',
          // name: 'John',
          // email: credentials?.email as string,
          // username: credentials?.username as string,
          id: userLogin.data.id,
          username: userLogin.data.username,
          display_name: userLogin.data.display_name,
          email: userLogin.data.email,
          role: userLogin.data.role
          // password: credentials?.password as string,
          // 'set-cookie': res.headers.get('set-cookie'),
          // ...loginData.data
        };
        // console.log('-----user----', user)
        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    })
  ],
  session: {
    // 使用JWT来管理会话
    strategy: 'jwt'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // console.log('----user---', user)
      // console.log('----account---', account)
      // console.log('----profile---', profile)
      // 处理 GitHub 登录成功后的回调
      if (account.provider === 'github') {
        // 可以在这里添加任何额外的逻辑，例如记录用户信息或进行其他验证
        // console.log('GitHub login successful:', user);
        const params = {
          ...user
        };
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + '/api/github/login',
          {
            method: 'POST',
            body: JSON.stringify(params),
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const userInfo = await res.json();
        if (!userInfo.success) return false;
        // 返回从后端 API 获取的用户数据
        account.userData = { ...userInfo.data };
        // account = { ...account, role: 1 }
        // console.log('*****account*****', account)
        // user = { ...user, ...userInfo.data }
        return true; // 返回 true 以允许登录
      }
      // user = { ...user, role: 1 }
      // user = { role: 1, aaa: 222 }

      return true; // 其他提供者的默认行为
    },
    async redirect(params: { url: string; baseUrl: string }) {
      // console.log('params', params);
      // console.log('params.url', params.url)
      // console.log('params.baseUrl', params.baseUrl)
      // 在用户登录后重定向到指定的端口
      // return 'http://localhost:3001'; // 替换为您需要的端口
      return params.url; // 替换为您需要的端口
    },
    async jwt({ token, user, session, trigger, account }) {
      // console.log('----jwt token----', token)
      // console.log('----jwt user----', user)
      // console.log('----jwt session----', session)
      // console.log('----jwt trigger----', trigger)
      // console.log('----jwt account----', account)
      if (user) {
        console.log('user******', user, account);
        token.id = user.id;
        token.username = user.username || account?.userData?.username;
        token.name = user.name;
        token.display_name =
          user.display_name || account?.userData?.display_name;
        token.email = user.email || account?.userData?.email;
        token.role = user.role || account?.userData?.role;
        // token.role = user.role || 1;
        // token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token, user }) {
      // session.display_name = user.display_name;
      // session.cookies = token[set-cookie];
      // console.log('----session session----', session)
      // console.log('----session token----', token)
      // console.log('----session user----', user)
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.name = token.name || token.display_name;
      session.user.email = token.email;
      session.user.role = token.role;
      // if (session?.user) {
      //   session?.user?.display_name = token.display_name
      // }
      // session.user.id = token.id;
      // if (token?.username && session.user) {
      //   session.user = token.username
      // }
      return session;
    }
  },
  pages: {
    signIn: '/' //sigin page
  }
} satisfies NextAuthConfig;

export default authConfig;
