'use client';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import FaceEnrollment from '@/components/FaceEnrollment';

// eslint-disable-next-line @next/next/no-async-client-component
const FaceEnrollmentPage = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Face Enrollment</h1>
        <p className="text-gray-500">Register your face for quick and secure login</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <FaceEnrollment 
              onSuccess={() => {
                // Refresh page or show success message
                window.location.reload();
              }}
              onCancel={() => {
                redirect('/');
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Why enroll your face?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Quick Login</p>
                  <p className="text-xs text-gray-500">Sign in with just your face</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure</p>
                  <p className="text-xs text-gray-500">Bank-grade encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Convenient</p>
                  <p className="text-xs text-gray-500">No more passwords</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Privacy First</h3>
              <p className="text-xs text-blue-700">
                We only store mathematical representations of your face, never the actual images.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaceEnrollmentPage;