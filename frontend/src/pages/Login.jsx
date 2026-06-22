import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

// Inner component that uses reCAPTCHA
const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Check if reCAPTCHA is ready
  useEffect(() => {
    const checkRecaptcha = setInterval(() => {
      if (typeof executeRecaptcha === "function") {
        setRecaptchaReady(true);
        clearInterval(checkRecaptcha);
      }
    }, 500);

    return () => clearInterval(checkRecaptcha);
  }, [executeRecaptcha]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Success Dialog
  const showSuccessDialog = (userData) => {
    return Swal.fire({
      title: "🎉 Selamat Datang!",
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-linear-to-r from-emerald-500 to-green-600 rounded-full mb-4 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          
          <p class="text-2xl font-bold text-gray-800 mb-1">${userData?.name || "User"}</p>
          <p class="text-sm text-gray-500 mb-4">Berhasil masuk ke sistem</p>
          
          <div class="bg-gray-50 rounded-xl p-4 text-left space-y-2">
            <div class="flex items-center justify-between py-1">
              <span class="text-sm text-gray-500">📧 Email</span>
              <span class="text-sm font-semibold text-gray-700">${userData?.email || "-"}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-t border-gray-200">
              <span class="text-sm text-gray-500">👤 Role</span>
              <span class="text-sm font-semibold text-gray-700">${userData?.role?.nama || userData?.role || "-"}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-t border-gray-200">
              <span class="text-sm text-gray-500">🏢 Organisasi</span>
              <span class="text-sm font-semibold text-gray-700">${userData?.organization?.nama || "-"}</span>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "✨ Lanjut ke Dashboard",
      confirmButtonColor: "#10B981",
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: "420px",
      padding: "1.5rem",
      backdrop: `rgba(0,0,0,0.5)`,
      customClass: {
        popup: "rounded-2xl",
        confirmButton:
          "px-6 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/dashboard");
      }
    });
  };

  // Error Dialog
  const showErrorDialog = (message) => {
    return Swal.fire({
      title: "Login Gagal",
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-3">
              <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          
          <p class="text-gray-700 mb-4">${message}</p>
          
          <div class="bg-red-50 rounded-lg p-3 text-left">
            <p class="text-xs font-semibold text-red-800 mb-2">💡 Tips:</p>
            <ul class="text-xs text-red-700 space-y-1">
              <li>• Periksa kembali email dan password Anda</li>
              <li>• Pastikan Caps Lock dalam keadaan mati</li>
              <li>• Hubungi administrator jika masalah berlanjut</li>
            </ul>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "🔄 Coba Lagi",
      confirmButtonColor: "#EF4444",
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: "400px",
      padding: "1.5rem",
      backdrop: `rgba(0,0,0,0.5)`,
      customClass: {
        popup: "rounded-2xl",
        confirmButton:
          "px-6 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all",
      },
    });
  };

  // Loading Dialog
  let currentSwal = null;

  const showLoadingDialog = () => {
    currentSwal = Swal.fire({
      title: "⏳ Memproses Login",
      html: `
        <div class="text-center py-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-3">
            <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <p class="text-gray-700 font-medium">Sedang memverifikasi data Anda</p>
          <p class="text-xs text-gray-400 mt-1">Mohon tunggu sebentar...</p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      showCancelButton: false,
      width: "360px",
      padding: "1.5rem",
      customClass: {
        popup: "rounded-2xl",
      },
    });
  };

  const closeLoadingDialog = () => {
    if (currentSwal) {
      currentSwal.close();
      currentSwal = null;
    }
    Swal.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if reCAPTCHA is ready
    if (!recaptchaReady || !executeRecaptcha) {
      showErrorDialog("Mohon tunggu sebentar, captcha sedang memuat...");
      return;
    }

    setLoading(true);
    showLoadingDialog();

    try {
      // Execute reCAPTCHA v3 dengan timeout
      const recaptchaPromise = executeRecaptcha("login");
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("reCAPTCHA timeout")), 15000),
      );

      const recaptchaToken = await Promise.race([
        recaptchaPromise,
        timeoutPromise,
      ]);

      if (!recaptchaToken) {
        throw new Error("reCAPTCHA token tidak valid");
      }

      const result = await login(formData, recaptchaToken);

      closeLoadingDialog();

      if (result.success) {
        await showSuccessDialog(result.user);
      } else {
        await showErrorDialog(
          result.message || "Email atau password yang Anda masukkan salah.",
        );
      }
    } catch (error) {
      closeLoadingDialog();

      let errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi.";
      if (error.message === "reCAPTCHA timeout") {
        errorMessage = "Waktu verifikasi captcha habis. Silakan coba lagi.";
      } else if (error.message === "reCAPTCHA token tidak valid") {
        errorMessage = "Verifikasi captcha gagal. Silakan coba lagi.";
      } else if (error.response?.status === 500) {
        errorMessage =
          "Server mengalami kesalahan. Silakan coba lagi nanti atau hubungi administrator.";
      }

      await showErrorDialog(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Brand with NU Theme */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-r from-green-700 to-emerald-600 rounded-2xl mb-4 shadow-lg hover:scale-105 transition-transform duration-300">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
            Nahdatul Ulama
          </h1>
          <p className="text-gray-600 mt-2">Silakan login untuk melanjutkan</p>
        </div>

        {/* Form Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-600 hover:shadow-2xl transition-shadow duration-300">
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              icon={
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
              required
            />

            {/* Input Password dengan Toggle */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`
                    w-full px-4 py-2 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all
                    ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Info untuk reCAPTCHA v3 */}
            <div className="mb-6 text-xs text-gray-400 text-center">
              <span className="text-green-600">✓</span> This site is protected
              by reCAPTCHA
              <a
                href="https://policies.google.com/privacy"
                className="text-green-600 hover:underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy
              </a>
              <span> and </span>
              <a
                href="https://policies.google.com/terms"
                className="text-green-600 hover:underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
              className="mb-4 bg-linear-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300"
            >
              Sign In
            </Button>

            <div className="text-center text-sm text-gray-600">
              <Link
                to="/forgot-password"
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                Lupa password?
              </Link>
            </div>
          </form>
        </div>

        {/* Footer with NU Theme */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Nahdatul Ulama. All rights
            reserved.
          </p>
          <p className="text-xs mt-1">"Rahmatan Lil Alamin"</p>
        </div>
      </div>
    </div>
  );
};

// Wrapper component dengan Provider
const Login = () => {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error("VITE_RECAPTCHA_SITE_KEY is not defined");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          Error: reCAPTCHA site key not configured. Please check your .env file.
        </div>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
        nonce: undefined,
      }}
      useRecaptchaNet={false}
    >
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
};

export default Login;