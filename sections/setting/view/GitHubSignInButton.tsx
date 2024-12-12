'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { signIn, signOut } from 'next-auth/react';

interface GitHubSignInButtonProps {
  isConnected?: boolean;
}

export function GitHubSignInButton({
  isConnected = false
}: GitHubSignInButtonProps) {
  const handleGithubSignIn = async () => {
    await signIn('github', { callbackUrl: '/dashboard/setting' });
  };

  const handleGithubDisconnect = async () => {
    // 这里需要调用后端 API 来解除绑定
    try {
      const response = await fetch('/api/auth/unlink-github', {
        method: 'POST'
      });
      if (response.ok) {
        // 可以添加成功提示
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to unlink GitHub account:', error);
    }
  };

  if (isConnected) {
    return (
      <Button variant="outline" type="button" onClick={handleGithubDisconnect}>
        <Icons.gitHub className="mr-2 h-4 w-4" />
        Unbind GitHub
      </Button>
    );
  }

  return (
    <Button variant="outline" type="button" onClick={handleGithubSignIn}>
      <Icons.gitHub className="mr-2 h-4 w-4" />
      Bind Github
    </Button>
  );
}
