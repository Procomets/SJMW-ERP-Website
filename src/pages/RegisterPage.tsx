import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, User, Zap, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Production Manager');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Full name is required.');
    if (!email.trim()) return setError('Email address is required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!role) return setError('Please choose a role.');

    setLoading(true);
    try {
      await register(email, password, name, role);
      // If the above call finishes without error, it means they are an Admin and signed in
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'REGISTRATION_SUCCESS_NON_ADMIN') {
        // Success case for Supervisor/Production Manager: Redirect to login with status explanation
        navigate('/login', {
          replace: true,
          state: {
            message: 'Registration successful! However, only administrators can access this portal directly. Please contact an Admin to check your status.',
          },
        });
      } else {
        setError(err.message ?? 'Registration failed. Please check details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#ffffff',
      }}
    >
      {/* Left branding panel with background image */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          position: 'relative',
          backgroundImage: 'url(/login_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
          },
        }}
      >
        {/* Top Branding Logo */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img src="/logo.png" alt="SJMW Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: 0.5 }}>
            Sri Jothi Moulding Works ERP
          </Typography>
        </Box>

        {/* Bottom Testimonial */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: 700,
              lineHeight: 1.3,
              mb: 2,
              letterSpacing: -0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            "The ultimate platform for moulding works and foundry operation management."
          </Typography>
          <Box>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
              By Procomet
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: { xs: 1, md: 1.2 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 4, sm: 6, md: 10 },
          bgcolor: '#ffffff',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400, py: 4 }}>
          {/* Mobile Logo Header */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <img src="/logo.png" alt="SJMW Logo" style={{ height: 36, width: 36, objectFit: 'contain' }} />
            <Typography sx={{ color: '#0f172a', fontWeight: 850, fontSize: '1.15rem' }}>
              Sri Jothi Moulding Works ERP
            </Typography>
          </Box>

          {/* Heading */}
          <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>
            Create your account
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 4, lineHeight: 1.5 }}>
            Fill in the details below to sign up to the metal operations portal
          </Typography>

          {/* Error alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.8rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                id="register-name"
                label="Full Name"
                type="text"
                placeholder="Alex Jordan"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={16} className="text-slate-400" />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                id="register-email"
                label="Email address"
                type="email"
                placeholder="alex.jordan@gmail.com"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={16} className="text-slate-400" />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                id="register-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={16} className="text-slate-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#64748b' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                id="register-confirm-password"
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={16} className="text-slate-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        size="small"
                        sx={{ color: '#64748b' }}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <FormControl fullWidth required sx={formControlSx}>
                <InputLabel id="role-select-label">System Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="register-role"
                  label="System Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Production Manager">Production Manager</MenuItem>
                  <MenuItem value="Supervisor">Supervisor</MenuItem>
                </Select>
              </FormControl>

              {role !== 'Admin' && (
                <Box sx={{ display: 'flex', gap: 1, p: 1.5, bg: '#fef3c7', borderRadius: 2, border: '1px solid #fcd34d', color: '#b55306', alignItems: 'center' }}>
                  <ShieldAlert size={16} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                    Note: As a non-Admin, you will not have website login permission directly.
                  </Typography>
                </Box>
              )}

              <Button
                id="register-submit"
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderRadius: 2.5,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.55)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': { opacity: 0.6 },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign up'}
              </Button>
            </Box>
          </form>

          {/* Footer Link */}
          <Typography sx={{ mt: 4, textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#6366f1',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#cbd5e1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    color: '#94a3b8',
    '&.Mui-focused': { color: '#6366f1' },
  },
};

const formControlSx = {
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
    borderRadius: 2.5,
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#cbd5e1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    color: '#94a3b8',
    '&.Mui-focused': { color: '#6366f1' },
  },
};
export default RegisterPage;
