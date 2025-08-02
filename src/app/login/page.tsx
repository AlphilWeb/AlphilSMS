"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";

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
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-emerald-800">Login</h2>

        {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}

        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
          required
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border border-gray-300 rounded text-black"
          required
        />

        <button
          type="submit"
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-4 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}