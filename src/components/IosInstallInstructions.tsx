import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import IosShareIcon from '@mui/icons-material/IosShare'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

interface IosInstallInstructionsProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Called when the user closes the dialog. */
  onClose: () => void
}

/**
 * Step-by-step modal explaining how to install Lexio on iOS Safari.
 *
 * iOS Safari does not support the `beforeinstallprompt` API, so the only way
 * to install is via the native Share sheet.  This dialog walks the user through
 * the three-step process.
 */
export function IosInstallInstructions({ open, onClose }: IosInstallInstructionsProps) {
  const steps = [
    {
      icon: <IosShareIcon fontSize="small" color="primary" />,
      primary: 'Tap the Share button',
      secondary: 'The share icon is at the bottom of the screen in Safari',
    },
    {
      icon: <AddBoxOutlinedIcon fontSize="small" color="primary" />,
      primary: 'Tap "Add to Home Screen"',
      secondary: 'Scroll down in the share sheet to find this option',
    },
    {
      icon: <CheckCircleOutlineIcon fontSize="small" color="primary" />,
      primary: 'Tap "Add"',
      secondary: 'Lexio will appear on your home screen like a native app',
    },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="ios-install-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          mx: 2,
        },
      }}
    >
      <DialogTitle id="ios-install-dialog-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/lexio/icons/icon-192.png"
            alt="Lexio icon"
            sx={{ width: 36, height: 36, borderRadius: 1.5 }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Install Lexio
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Add to your home screen
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <List dense disablePadding>
          {steps.map((step, index) => (
            <ListItem key={index} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>{step.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {index + 1}. {step.primary}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {step.secondary}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained" color="primary" fullWidth>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}
