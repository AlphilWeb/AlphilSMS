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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await fetchAPI<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!data?.user || !data.token) {
        throw new Error("Invalid response from server");
      }

      const role = data.user.role.toLowerCase();

      switch (role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "student":
          router.push("/dashboard/student");
          break;
        case "registrar":
          router.push("/dashboard/registrar");
          break;
        case "hod":
          router.push("/dashboard/department-head");
          break;
        case "bursar":
          router.push("/dashboard/finance");
          break;
        case "lecturer":
          router.push("/dashboard/lecturer");
          break;
        default:
          setError("Access denied: Invalid user role");
          break;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Handle API error messages
        try {
          const errorData = JSON.parse(err.message.replace('API error: ', ''));
          setError(errorData.error || err.message);
        } catch {
          setError(err.message);
        }
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
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
                className="mb-4 border rounded-full "
                priority
              />
              <h1 className="text-2xl font-bold text-emerald-800">Alphil Training College</h1>
              <p className="text-gray-600 mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-black w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-black"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? 'bg-emerald-600 cursor-wait'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                  Authenticating...
                </span>
              ) : (
                'Login'
              )}
            </button>

            {/* <div className="mt-4 text-center text-sm text-gray-600">
              <a href="#" className="text-emerald-700 hover:underline">Forgot password?</a>
            </div> */}
          </form>

          <div className="mt-6 text-center text-sm text-white">
            © {new Date().getFullYear()} Alphil Training College. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}