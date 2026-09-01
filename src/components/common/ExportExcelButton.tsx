import React from 'react';
import { Button, useTheme } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface ExportExcelButtonProps extends ButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({ onClick, disabled, sx, children = "Export", ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Button
            variant="outlined"
            startIcon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28" height="28">
                    <rect x="20" y="8" width="22" height="32" fill="#21a366" rx="3"/>
                    <rect x="22" y="10" width="8" height="6" fill="#107c41"/>
                    <rect x="32" y="10" width="8" height="6" fill="#107c41"/>
                    <rect x="22" y="18" width="8" height="6" fill="#107c41"/>
                    <rect x="32" y="18" width="8" height="6" fill="#107c41"/>
                    <rect x="22" y="26" width="8" height="6" fill="#107c41"/>
                    <rect x="32" y="26" width="8" height="6" fill="#107c41"/>
                    <rect x="22" y="34" width="8" height="6" fill="#107c41"/>
                    <rect x="32" y="34" width="8" height="6" fill="#107c41"/>
                    <rect x="8" y="14" width="22" height="20" fill="#185c37" rx="2"/>
                    <path fill="#fff" d="M13,29l2.5-5L13,19h2.5l1.5,3.5L18.5,19H21l-2.5,5L21,29h-2.5l-1.5-3.5L15.5,29H13z"/>
                </svg>
            }
            onClick={onClick}
            disabled={disabled}
            sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                borderColor: '#107c41',
                fontWeight: 600,
                '&:hover': {
                    backgroundColor: '#f3f2f1',
                    borderColor: '#107c41'
                },
                ...(isDark && {
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    borderColor: '#21a366',
                    '&:hover': {
                        backgroundColor: '#334155',
                        borderColor: '#21a366'
                    }
                }),
                ...sx
            }}
            {...props}
        >
            {children}
        </Button>
    );
};

export default ExportExcelButton;
