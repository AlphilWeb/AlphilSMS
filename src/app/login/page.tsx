"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import Image from "next/image";
import Head from "next/head";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface ValidationError {
  field?: string;
  message: string;
}

// Define the expected error response structure
interface ApiError {
  error?: string;
  message?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Clear errors when user starts typing
  const clearErrors = () => {
    setError(null);
    setValidationErrors([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    setIsLoading(true);

    // Client-side validation
    const errors: ValidationError[] = [];
    
    if (!email.trim()) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
    }
    
    if (!password) {
      errors.push({ field: "password", message: "Password is required" });
    } else if (password.length < 6) {
      errors.push({ field: "password", message: "Password must be at least 6 characters" });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchAPI<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Check if the response indicates an error based on status code
      if (response.status >= 400) {
        let errorMessage = "Login failed. Please try again.";
        
        try {
          // Try to parse the response body for error details
          // This assumes your API returns error information in the data field
          const errorData = response.data as unknown as ApiError;
          
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (typeof response.data === 'string') {
            errorMessage = response.data;
          }
        } catch (parseError) {
          // If parsing fails, use a generic error message
          console.error("Error parsing API response:", parseError);
        }

        // Map common error messages to user-friendly versions
        const errorMappings: Record<string, string> = {
          "Invalid credentials": "The email or password you entered is incorrect",
          "User not found": "No account found with this email address",
          "User is not active": "Your account has been deactivated. Please contact support",
          "Network Error": "Unable to connect to the server. Please check your internet connection",
          "Request failed with status code 401": "Invalid email or password",
          "Request failed with status code 403": "Access denied. Please contact your administrator",
          "Request failed with status code 500": "Server error. Please try again later",
        };

        setError(errorMappings[errorMessage] || errorMessage);
        setIsLoading(false);
        return;
      }

      // If we reach here, the request was successful
      const data = response.data;
      
      if (!data?.user || !data.token) {
        setError("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      const role = data.user.role.toLowerCase();

      const roleRoutes: Record<string, string> = {
        "admin": "/dashboard/admin",
        "student": "/dashboard/student",
        "registrar": "/dashboard/registrar",
        "hod": "/dashboard/department-head",
        "bursar": "/dashboard/finance",
        "lecturer": "/dashboard/lecturer",
      };

      const route = roleRoutes[role];
      
      if (route) {
        // Add a small delay to show success state
        setTimeout(() => {
          router.push(route);
        }, 500);
      } else {
        setError("Access denied: Your role does not have access to the system");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (err instanceof Error) {
        if (err.message.includes("Network Error") || err.message.includes("Failed to fetch")) {
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "The request timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Helper to check if a field has validation error
  const getFieldError = (fieldName: string): string | null => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : null;
  };

  return (
    <>
      <Head>
        <title>Login | Alphil Training College</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background image without blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.jpg"
            alt="Alphil Training College Background"
            fill
            className="object-cover"
            quality={100}
            priority
          />
          <div className="absolute inset-0 bg-emerald-950/70" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          <form
            onSubmit={handleLogin}
            className="bg-white p-8 rounded-xl shadow-2xl border border-emerald-100/20"
            style={{
              cursor: isLoading ? 'wait' : 'auto'
            }}
          >
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/icon.jpg"
                alt="Alphil Training College Logo"
                width={80}
                height={80}
                className="mb-4 border rounded-full"
                priority
              />
              <h1 className="text-2xl font-bold text-emerald-800">Alphil Training College</h1>
              <p className="text-gray-600 mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Login Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email
                {getFieldError("email") && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearErrors();
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-black ${
                  getFieldError("email") ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your email address"
              />
              {getFieldError("email") && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {getFieldError("email")}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Password
                {getFieldError("password") && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearErrors();
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-black ${
                  getFieldError("password") ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
              {getFieldError("password") && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {getFieldError("password")}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
                isLoading
                  ? 'bg-emerald-600 cursor-wait'
                  : 'bg-emerald-700 hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Additional help section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Need help?</h3>
              <p className="text-xs text-gray-600">
                If you're having trouble logging in, please contact the system administrator at{" "}
                <span className="text-emerald-700">support@alphilcollege.com</span>
              </p>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-white">
            © {new Date().getFullYear()} Alphil Training College. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}