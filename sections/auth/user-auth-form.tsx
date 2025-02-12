'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import GithubSignInButton from './github-auth-button';
import GoogleSignInButton from './google-auth-button';
import { toast } from 'sonner';

export default function UserAuthForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const [isRegister, setIsRegister] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  console.log('session', session, status);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl ?? '/dashboard');
    }
  }, [status, router]);

  const defaultValues = {
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    verificationCode: ''
  };

  const formSchema = useMemo(
    () =>
      z
        .object({
          username: isResetPassword
            ? z.string().optional()
            : z
                .string({
                  required_error: 'Username is required',
                  invalid_type_error: 'Username is required'
                })
                .min(1, 'Username is required'),

          email:
            isResetPassword || isRegister
              ? z
                  .string({
                    required_error: 'Email is required',
                    invalid_type_error: 'Email is required'
                  })
                  .email('Invalid email format')
              : z.string().optional(),

          verificationCode: isRegister
            ? z.string({
                required_error: 'Verification code is required',
                invalid_type_error: 'Verification code is required'
              })
            : z.string().optional(),

          password: isResetPassword
            ? z.string().optional()
            : z
                .string({
                  required_error: 'Password is required',
                  invalid_type_error: 'Password is required'
                })
                .min(1, 'Password is required')
                .refine(
                  (password) =>
                    !password ||
                    (password.length >= 8 && password.length <= 20),
                  'Password must be between 8 and 20 characters'
                ),

          confirmPassword: isRegister
            ? z
                .string({
                  required_error: 'Confirm password is required',
                  invalid_type_error: 'Confirm password is required'
                })
                .min(1, 'Confirm password is required')
                .refine(
                  (password) =>
                    !password ||
                    (password.length >= 8 && password.length <= 20),
                  'Password must be between 8 and 20 characters'
                )
            : z.string().optional()
        })
        .refine(
          (data) => {
            if (isRegister) {
              return data.password === data.confirmPassword;
            }
            return true;
          },
          {
            message: 'Passwords do not match',
            path: ['confirmPassword']
          }
        ),
    [isRegister, isResetPassword]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const handleUserRegister = async (params: z.infer<typeof formSchema>) => {
    const res = await fetch(`/api/user/register`, {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data } = await res.json();
    // console.log('---data---', data);
    signIn('credentials', {
      username: params.username,
      password: params.password,
      callbackUrl: callbackUrl ?? '/dashboard'
    });
  };

  const handleSendVerificationCode = async () => {
    const email = form.getValues('email');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setCodeSending(true);
      const params = new URLSearchParams({ email });
      const res = await fetch(`/api/verification?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      const { success, message } = await res.json();

      if (!success) {
        throw new Error(message || 'Failed to send verification code');
        return;
      }

      toast.success('Verification code sent successfully');

      // Start countdown timer (60 seconds)
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code'
      );
    } finally {
      setCodeSending(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const email = form.getValues('email');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      const params = new URLSearchParams({ email });
      const res = await fetch(`/api/reset_password?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      const { success, message } = await res.json();
      if (success) {
        toast.success('Password reset email sent successfully');
      } else {
        throw new Error(message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send reset email'
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('onSubmit triggered', data);
    startTransition(() => {
      if (isResetPassword) {
        handleResetPassword();
      } else if (isRegister) {
        const params = {
          username: data.username,
          email: data.email,
          password: data.password,
          password2: data.confirmPassword,
          verification_code: data.verificationCode
        };
        handleUserRegister(params);
      } else {
        signIn('credentials', {
          username: data.username,
          password: data.password,
          callbackUrl: callbackUrl ?? '/dashboard'
        });
      }
    });
  };

  const toggleMode = () => {
    setIsRegister(false);
    setIsResetPassword(!isResetPassword);
    form.reset(); // 清空表单
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          {!isResetPassword ? (
            <>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your username..."
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegister && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email..."
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendVerificationCode}
                            disabled={loading || codeSending || countdown > 0}
                          >
                            {countdown > 0 ? `${countdown}s` : 'Get Code'}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verificationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter verification code..."
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password..."
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegister && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Please enter your password again..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          ) : (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Please enter the email address used to register..."
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center justify-between text-sm">
            {!isResetPassword ? (
              <>
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => setIsRegister(!isRegister)}
                >
                  {isRegister ? 'Sign in' : 'Sign up'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={toggleMode}
                >
                  Forgot your password?
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={toggleMode}
              >
                Back to Login
              </Button>
            )}
          </div>

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {isResetPassword
              ? 'Send password reset email'
              : isRegister
              ? 'Sign up'
              : 'Sign in'}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <GithubSignInButton />
      <GoogleSignInButton />
    </>
  );
}
