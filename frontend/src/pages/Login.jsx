import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../contexts/ModalContext";
import {
  EnvelopeIcon,
  KeyIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { success, error, loading: showLoading, hideLoading } = useModal();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const features = [
    {
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      title: "Ahlussunnah Wal Jamaah",
      description: "Berlandaskan Islam moderat"
    },
    {
      icon: <UserGroupIcon className="w-5 h-5" />,
      title: "Organisasi Terbesar",
      description: "Mengayomi seluruh umat"
    },
    {
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      title: "Sistem Manajemen",
      description: "Modern & Terintegrasi"
    }
  ];

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

  const showSuccessDialog = (userData) => {
    return new Promise((resolve) => {
      const message = `
        <div class="text-center">
          <p class="text-lg font-semibold text-gray-800">${userData?.name || "User"}</p>
          <p class="text-sm text-gray-500">Berhasil masuk ke sistem</p>
          <div class="bg-gray-50 rounded-lg p-3 text-left space-y-1 mt-3">
            <div class="flex justify-between py-1 border-b border-gray-100">
              <span class="text-xs text-gray-500">Email</span>
              <span class="text-xs font-medium text-gray-700">${userData?.email || "-"}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100">
              <span class="text-xs text-gray-500">Role</span>
              <span class="text-xs font-medium text-gray-700">${userData?.role?.nama || userData?.role || "-"}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-xs text-gray-500">Organisasi</span>
              <span class="text-xs font-medium text-gray-700">${userData?.organization?.nama || "-"}</span>
            </div>
          </div>
        </div>
      `;

      success(
        "Selamat Datang",
        message,
        () => {
          navigate("/dashboard");
          resolve(true);
        },
        "Lanjut"
      );
    });
  };

  const showErrorDialog = (message) => {
    return new Promise((resolve) => {
      const errorMessage = `
        <div class="text-center">
          <p class="text-sm text-gray-700">${message}</p>
          <div class="bg-gray-50 rounded-lg p-3 text-left mt-3">
            <p class="text-xs font-semibold text-gray-700 mb-2">Tips:</p>
            <ul class="text-xs text-gray-600 space-y-1">
              <li>• Periksa kembali email dan password Anda</li>
              <li>• Pastikan Caps Lock dalam keadaan mati</li>
              <li>• Hubungi administrator jika masalah berlanjut</li>
            </ul>
          </div>
        </div>
      `;

      error(
        "Login Gagal",
        errorMessage,
        () => {
          resolve(false);
        },
        "Coba Lagi"
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!recaptchaReady || !executeRecaptcha) {
      await showErrorDialog("Mohon tunggu sebentar, captcha sedang memuat...");
      return;
    }

    setLoading(true);
    showLoading("Memproses Login", "Sedang memverifikasi data Anda...");

    try {
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

      hideLoading();

      if (result.success) {
        await showSuccessDialog(result.user);
      } else {
        await showErrorDialog(
          result.message || "Email atau password yang Anda masukkan salah."
        );
      }
    } catch (error) {
      hideLoading();
      
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-900 via-green-800 to-green-900 px-4 py-12">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-linear-to-br from-green-600 to-emerald-600 shadow-lg flex items-center justify-center p-2">
                <img 
                  src="/logo.png" 
                  alt="Nahdlatul Ulama Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/80?text=NU";
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Nahdlatul Ulama
                </h1>
                <p className="text-green-300/70 text-sm">Sistem Informasi Manajemen</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Digital Transformation
              <br />
              <span className="bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Nahdlatul Ulama
              </span>
            </h2>
            
            <p className="text-green-100/80 text-lg leading-relaxed mb-6">
              Platform digital 
              untuk mengelola, memantau, mengevaluasi kegiatan program kerja secara terstruktrur dan sistematis
              
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-green-800/40 backdrop-blur-sm rounded-xl p-4 border border-green-700/50 hover:border-green-500/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-green-400 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-semibold text-sm">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-green-300/60 text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute bottom-10 left-10 opacity-10">
            <SparklesIcon className="w-40 h-40 text-green-500" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg mb-4 p-2">
              <img 
                src="/logo.png" 
                alt="Nahdlatul Ulama Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/96?text=NU";
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang</h2>
            <p className="text-green-200/70">Silakan login untuk melanjutkan</p>
          </div>

          <div className="bg-green-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-green-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`
                      block w-full pl-10 pr-3 py-3 bg-green-700/50 border rounded-xl 
                      text-white placeholder-green-300/50 focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.email 
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                        : "border-green-600 focus:ring-green-500/20 focus:border-green-500"
                      }
                    `}
                    placeholder="masukkan@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`
                      block w-full pl-10 pr-12 py-3 bg-green-700/50 border rounded-xl 
                      text-white placeholder-green-300/50 focus:outline-none focus:ring-2 transition-all duration-200
                      ${errors.password 
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                        : "border-green-600 focus:ring-green-500/20 focus:border-green-500"
                      }
                    `}
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-400 hover:text-green-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-center text-xs text-green-300/60">
                <span className="text-green-400">✓</span> Site protected by reCAPTCHA
                <a
                  href="https://policies.google.com/privacy"
                  className="text-green-400 hover:text-green-300 ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy
                </a>
                <span> and </span>
                <a
                  href="https://policies.google.com/terms"
                  className="text-green-400 hover:text-green-300 ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200
                  flex items-center justify-center gap-2 group
                  ${loading
                    ? "bg-green-700 cursor-not-allowed"
                    : "bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 hover:shadow-xl transform hover:scale-[1.02]"
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-800/30 rounded-lg backdrop-blur-sm border border-green-700/30">
              <div className="text-xl font-bold text-white">100+</div>
              <div className="text-xs text-green-300/60">Tahun Berdiri</div>
            </div>
            <div className="text-center p-3 bg-green-800/30 rounded-lg backdrop-blur-sm border border-green-700/30">
              <div className="text-xl font-bold text-white">90M+</div>
              <div className="text-xs text-green-300/60">Warga NU</div>
            </div>
            <div className="text-center p-3 bg-green-800/30 rounded-lg backdrop-blur-sm border border-green-700/30">
              <div className="text-xl font-bold text-white">Aswaja</div>
              <div className="text-xs text-green-300/60">Moderat & Toleran</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error("VITE_RECAPTCHA_SITE_KEY is not defined");
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-900 to-green-800">
        <div className="bg-green-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <div className="text-red-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold mb-2 text-white">Konfigurasi Error</h2>
            <p className="text-green-200">reCAPTCHA site key tidak ditemukan.</p>
            <p className="text-sm mt-2 text-green-300/60">Silakan periksa file .env Anda.</p>
          </div>
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