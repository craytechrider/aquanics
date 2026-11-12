import React from 'react';
import { NavLink } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Sign in</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="email" placeholder="m@example.com" type="email" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                Password
              </label>
              <NavLink to="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-500 font-medium">Forgot password?</NavLink>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="password" type="password" className="pl-10" />
            </div>
          </div>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Login with Google
          </Button>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        Don't have an account?{" "}
        <NavLink to="/register" className="font-semibold text-cyan-600 hover:text-cyan-500">
          Register
        </NavLink>
      </div>
    </div>
  );
}
