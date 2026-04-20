import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from '../components/Dashboard'

export default function DashboardPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return <Dashboard />
}
