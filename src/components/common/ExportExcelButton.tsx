import React from 'react';
import { Button, useTheme } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface ExportExcelButtonProps extends ButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({ onClick, disabled, sx, children = "Export Excel", ...props }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Button
      variant="outlined"
      startIcon={
        <img
          src="https://cdn-icons-png.flaticon.com/512/732/732220.png"
          alt="Excel Icon"
          width="24"
          height="24"
          style={{ objectFit: 'contain' }}
        />
      }
      onClick={onClick}
      disabled={disabled}
      sx={{
        backgroundColor: '#ffffff',
        color: '#15803d',
        borderColor: '#16a34a',
        fontWeight: 700,
        '&:hover': {
          backgroundColor: '#f0fdf4',
          borderColor: '#15803d',
        },
        ...(isDark && {
          backgroundColor: '#1e293b',
          color: '#4ade80',
          borderColor: '#22c55e',
          '&:hover': {
            backgroundColor: '#14532d',
            borderColor: '#4ade80',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ExportExcelButton;
