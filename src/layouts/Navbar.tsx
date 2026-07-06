import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tooltip,
  Alert,
} from '@mui/material';
import { Menu as MenuIcon, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToLockStatus, verifyLockPassword, toggleLockStatus } from '../services/settings.service';

interface NavbarProps {
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

const Navbar = ({ handleDrawerToggle, drawerWidth }: NavbarProps) => {
  const theme = useTheme();
  const { profile } = useAuth();
  
  const [locked, setLocked] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const name = profile?.name || 'Admin User';
  const role = profile?.role || 'Plant Manager';
  const firstLetter = name.trim().charAt(0).toUpperCase() || 'A';
  const isAdmin = role.toLowerCase().includes('admin');

  useEffect(() => {
    const unsubscribe = subscribeToLockStatus((status) => {
      setLocked(status);
    });
    return () => unsubscribe();
  }, []);

  const handleLockClick = () => {
    setPassword('');
    setError('');
    setDialogOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      const isCorrect = await verifyLockPassword(password);
      if (isCorrect) {
        await toggleLockStatus(locked);
        setDialogOpen(false);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update lock status.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin && (
              <Tooltip title={locked ? "Approved entries are Locked. Click to unlock." : "Approved entries are Unlocked. Click to lock."}>
                <IconButton 
                  onClick={handleLockClick}
                  sx={{ 
                    color: locked ? '#dc2626' : '#16a34a',
                    bgcolor: locked ? '#fee2e2' : '#dcfce7',
                    '&:hover': { bgcolor: locked ? '#fecaca' : '#bbf7d0' },
                    mr: 1,
                    width: 38,
                    height: 38,
                  }}
                >
                  {locked ? <Lock size={18} /> : <Unlock size={18} />}
                </IconButton>
              </Tooltip>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1, cursor: 'pointer' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36, fontWeight: 700 }}>
                {firstLetter}
              </Avatar>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Lock/Unlock Password Dialog */}
      <Dialog open={dialogOpen} onClose={() => !processing && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePasswordSubmit}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            {locked ? <Unlock style={{ color: '#16a34a' }} size={20} /> : <Lock style={{ color: '#dc2626' }} size={20} />}
            {locked ? 'Unlock Approved Entries' : 'Lock Approved Entries'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please enter the master lock password to {locked ? 'unlock' : 'lock'} all admin-approved data entries.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              autoFocus
              label="Password"
              type="password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={processing}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color={locked ? 'success' : 'error'} disabled={processing}>
              {processing ? 'Processing...' : (locked ? 'Unlock' : 'Lock')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Navbar;
