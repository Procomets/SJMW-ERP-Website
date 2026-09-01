import React from 'react';
import { Button, useTheme } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface ExportPdfButtonProps extends ButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({ onClick, disabled, sx, children = "Export PDF", ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Button
            variant="outlined"
            startIcon={
                <img src="https://static.vecteezy.com/system/resources/previews/023/234/824/non_2x/pdf-icon-red-and-white-color-for-free-png.png" alt="PDF Icon" width="28" height="28" style={{ objectFit: 'contain' }} />
            }
            onClick={onClick}
            disabled={disabled}
            sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                borderColor: '#e53935',
                fontWeight: 600,
                '&:hover': {
                    backgroundColor: '#ffebee',
                    borderColor: '#e53935'
                },
                ...(isDark && {
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    borderColor: '#ef5350',
                    '&:hover': {
                        backgroundColor: '#334155',
                        borderColor: '#ef5350'
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

export default ExportPdfButton;
