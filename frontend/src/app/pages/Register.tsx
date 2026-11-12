import React from 'react';
import { NavLink } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, Building, Landmark, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Register() {
  const [role, setRole] = React.useState('farmer');

  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
          <CardDescription>
            Join the smart agriculture community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="first-name">First name</label>
              <Input id="first-name" placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="last-name">Last name</label>
              <Input id="last-name" placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="email" placeholder="m@example.com" type="email" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="password" type="password" className="pl-10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
               <button 
                 onClick={() => setRole('farmer')}
                 className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all", 
                   role === 'farmer' ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-slate-100 hover:border-slate-200 text-slate-500"
                 )}
               >
                 <User className="h-5 w-5 mb-1" />
                 <span className="text-xs font-semibold">Farmer</span>
               </button>
               <button 
                 onClick={() => setRole('coop')}
                 className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all", 
                   role === 'coop' ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-slate-100 hover:border-slate-200 text-slate-500"
                 )}
               >
                 <Building className="h-5 w-5 mb-1" />
                 <span className="text-xs font-semibold">Co-op</span>
               </button>
               <button 
                 onClick={() => setRole('lgu')}
                 className={cn("flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all", 
                   role === 'lgu' ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-slate-100 hover:border-slate-200 text-slate-500"
                 )}
               >
                 <Landmark className="h-5 w-5 mb-1" />
                 <span className="text-xs font-semibold">LGU</span>
               </button>
            </div>
          </div>

          <Button className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4">
            Create Account
          </Button>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <NavLink to="/login" className="font-semibold text-cyan-600 hover:text-cyan-500">
          Sign In
        </NavLink>
      </div>
    </div>
  );
}
