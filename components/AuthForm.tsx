'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, Camera, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import CustomInput from './CustomInput';
import FaceVerification from './FaceVerification';
import { authFormSchema } from '@/lib/utils';
import { apiFetch } from '@/lib/api/http';
import { setSession, getSession } from '@/lib/session/session';

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [faceFailed, setFaceFailed] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      dateOfBirth: '',
      ssn: '',
    },
  });

  // Kiểm tra session khi vào trang
  useEffect(() => {
    console.log('🟢 AuthForm mounted, type:', type);
    
    if (type === 'sign-in') {
      const session = getSession();
      console.log('🔍 Checking session:', session);
      
      if (session?.userID && !faceFailed) {
        console.log('✅ Has session, showing face verification');
        setHasSession(true);
        setCurrentUserId(session.userID);
        setShowFaceVerification(true);
        setShowEmailForm(false);
      } else {
        console.log('❌ No session or face failed, showing email form');
        setHasSession(!!session?.userID);
        setShowFaceVerification(false);
        setShowEmailForm(true);
      }
    } else {
      console.log('📝 Sign-up mode, showing email form');
      setShowFaceVerification(false);
      setShowEmailForm(true);
    }
  }, [type, faceFailed]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      if (type === 'sign-up') {
        const payload = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };

        const res = await apiFetch<{ status: string; message: string; user?: any }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, false);

        if (res.status === 'success') {
          toast.success('Registration successful!', {
            description: 'Please sign in with your credentials.',
            duration: 5000,
          });
          router.replace('/sign-in');
        } else {
          toast.error('Registration failed', {
            description: res.message || 'Something went wrong. Please try again.',
          });
          form.setError('root', { message: res.message || 'Registration failed' });
        }
      }

      if (type === 'sign-in') {
        const res = await apiFetch<{ user: any; accessToken: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }, false);
        
        console.log('📥 Login response:', res);
        const userId = res?.user ? Number(res.user.userID ?? res.user.id ?? 0) : 0;

        setSession({
          token: res?.accessToken || '',
          userID: userId,
        });
        
        toast.success('Login successful!', {
          description: `Welcome back${res.user?.firstName ? ' ' + res.user.firstName : ''}!`,
          duration: 3000,
        });
        
        console.log('✅ Login successful, redirecting to home');
        router.replace('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      if (err?.status === 401) {
        toast.error('Invalid credentials', {
          description: 'Email or password is incorrect.',
        });
      } else if (err?.status === 400) {
        toast.error('Validation error', {
          description: err?.message || 'Please check your input.',
        });
      } else if (err?.status === 409) {
        toast.error('Email already exists', {
          description: 'This email is already registered. Please sign in instead.',
        });
      } else {
        toast.error('Something went wrong', {
          description: err?.message || 'Please try again later.',
        });
      }
      
      form.setError('root', {
        message: err?.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceSuccess = () => {
    console.log('✅ Face verification success, redirecting to home');
    toast.success('Face verification successful!', {
      description: 'Welcome back!',
      duration: 3000,
    });
    router.replace('/');
    router.refresh();
  };

  const handleFaceFallback = () => {
    console.log('⚠️ Face verification failed 2 times');
    toast.warning('Face verification failed', {
      description: 'Please use email and password to sign in.',
    });
    setFaceFailed(true);
    setShowFaceVerification(false);
    setShowEmailForm(true);
  };

  const handleFaceError = (error: string) => {
    console.log('❌ Face error:', error);
    toast.error('Face verification error', {
      description: error || 'Please use email and password to sign in.',
    });
    setFaceFailed(true);
    setShowFaceVerification(false);
    setShowEmailForm(true);
  };

  const handleRetryFace = () => {
    console.log('🔄 Manual retry face clicked');
    const session = getSession();
    
    if (session?.userID) {
      console.log('✅ Using session userID:', session.userID);
      toast.info('Starting face verification...', {
        description: 'Please look at the camera.',
      });
      setFaceFailed(false);
      setCurrentUserId(session.userID);
      setShowFaceVerification(true);
      setShowEmailForm(false);
    } else {
      console.log('❌ No session');
      toast.error('No active session', {
        description: 'Please sign in with email and password first.',
      });
      setShowFaceVerification(false);
      setShowEmailForm(true);
    }
  };

  console.log('🔄 Render state:', { 
    showFaceVerification, 
    showEmailForm, 
    currentUserId, 
    faceFailed,
    hasSession 
  });

  // Nếu đang hiển thị quét mặt
  if (showFaceVerification && currentUserId) {
    console.log('👤 Rendering face verification');
    return (
      <section className="auth-form">
        <header className="flex flex-col gap-5 md:gap-8">
          <Link href="/" className="cursor-pointer flex items-center gap-1">
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="Horizon logo"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              Horizon
            </h1>
          </Link>

          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
              Quick Login
            </h1>
            <p className="text-16 font-normal text-gray-600">
              Look at the camera to continue
            </p>
          </div>
        </header>

        <FaceVerification
          userId={currentUserId}
          onSuccess={handleFaceSuccess}
          onFallback={handleFaceFallback}
          onError={handleFaceError}
        />

        <footer className="flex justify-center gap-1 mt-6">
          <p className="text-14 font-normal text-gray-600">
            Having trouble?
          </p>
          <button
            onClick={() => {
              setFaceFailed(true);
              setShowFaceVerification(false);
              setShowEmailForm(true);
            }}
            className="form-link"
          >
            Use email & password
          </button>
        </footer>
      </section>
    );
  }

  // Nếu đang hiển thị form nhập email/password
  if (showEmailForm) {
    console.log('📧 Rendering email form');
    return (
      <section className="auth-form">
        <header className="flex flex-col gap-5 md:gap-8">
          <Link href="/" className="cursor-pointer flex items-center gap-1">
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="Horizon logo"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              Horizon
            </h1>
          </Link>

          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
              {type === 'sign-in' ? 'Sign In' : 'Sign Up'}
            </h1>
            <p className="text-16 font-normal text-gray-600">
              Enter your details
            </p>
          </div>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {type === 'sign-up' && (
              <>
                <div className="flex gap-4">
                  <CustomInput
                    control={form.control}
                    name="firstName"
                    label="First Name"
                    placeholder="Enter your first name"
                  />
                  <CustomInput
                    control={form.control}
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter your last name"
                  />
                </div>
                <CustomInput
                  control={form.control}
                  name="address1"
                  label="Address"
                  placeholder="Enter your specific address"
                />
                <CustomInput
                  control={form.control}
                  name="city"
                  label="City"
                  placeholder="Enter your city"
                />
                <div className="flex gap-4">
                  <CustomInput
                    control={form.control}
                    name="state"
                    label="State"
                    placeholder="Example: NY"
                  />
                  <CustomInput
                    control={form.control}
                    name="postalCode"
                    label="Postal Code"
                    placeholder="Example: 11101"
                  />
                </div>
                <div className="flex gap-4">
                  <CustomInput
                    control={form.control}
                    name="dateOfBirth"
                    label="Date of Birth"
                    placeholder="YYYY-MM-DD"
                  />
                  <CustomInput
                    control={form.control}
                    name="ssn"
                    label="SSN"
                    placeholder="Example: 1234"
                  />
                </div>
              </>
            )}

            <CustomInput
              control={form.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
            />

            <CustomInput
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            {form.formState.errors.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="form-btn w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Loading...
                </>
              ) : type === 'sign-in' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </Button>

            {/* NÚT QUÉT MẶT */}
            {type === 'sign-in' && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
            )}

            {type === 'sign-in' && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetryFace}
                  className="relative group overflow-hidden transition-all duration-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Camera className="w-4 h-4 mr-2 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 group-hover:text-blue-600">Face ID</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="relative group overflow-hidden transition-all duration-300 hover:border-green-500 hover:bg-green-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Fingerprint className="w-4 h-4 mr-2 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 group-hover:text-green-600">Fingerprint</span>
                </Button>
              </div>
            )}
          </form>
        </Form>

        <footer className="flex justify-center gap-1 mt-6">
          <p className="text-14 font-normal text-gray-600">
            {type === 'sign-in'
              ? "Don't have an account?"
              : 'Already have an account?'}
          </p>
          <Link
            href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
            className="form-link"
          >
            {type === 'sign-in' ? 'Sign up' : 'Sign in'}
          </Link>
        </footer>
      </section>
    );
  }

  // Fallback - không nên xảy ra
  console.log('⏳ Rendering fallback (should not happen)');
  return null;
};

export default AuthForm;