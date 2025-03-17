"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async (action: 'login' | 'signup') => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsAuthenticating(true);

    try {
      const { user, error } = await (action === 'login' ? signIn(email, password) : signUp(email, password));
      
      if (error) {
        console.error(`${action} error:`, error);
        toast.error(error.message);
        return;
      }

      if (user) {
        toast.success(`${action === 'login' ? 'Logged in' : 'Signed up'} successfully!`);
      } else if (action === 'signup') {
        toast.success("Please check your email to confirm your account");
      }
    } catch (error) {
      console.error(`Unexpected ${action} error:`, error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show loading spinner while the auth context is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show auth form even if user is set - the auth context will handle redirect
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome to SmartCal</CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAuthenticating}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAuthenticating}
                />
                <Button
                  className="w-full"
                  onClick={() => handleAuth('login')}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAuthenticating}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAuthenticating}
                />
                <Button
                  className="w-full"
                  onClick={() => handleAuth('signup')}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing up...
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 