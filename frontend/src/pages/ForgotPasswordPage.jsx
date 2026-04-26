import ForgotPassword from '../components/ForgotPassword'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#07080d] text-zinc-800 dark:text-zinc-300 relative flex items-center justify-center w-full transition-colors duration-300">
      <div className="auth-gridlines"></div>
      <div className="auth-bg-glow"></div>
      <ForgotPassword />
    </div>
  )
}
