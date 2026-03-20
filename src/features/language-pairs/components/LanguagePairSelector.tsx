import { useState, useCallback } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import type { LanguagePair } from '@/types'

export interface LanguagePairSelectorProps {
  readonly pairs: readonly LanguagePair[]
  readonly activePair: LanguagePair | null
  readonly loading: boolean
  readonly onSwitch: (pairId: string) => void
  readonly onAddPair: () => void
}

/**
 * Dropdown selector shown in the AppBar for switching the active language pair.
 * Also provides an entry point to create a new pair.
 */
export function LanguagePairSelector({
  pairs,
  activePair,
  loading,
  onSwitch,
  onAddPair,
}: LanguagePairSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = anchorEl !== null

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleSwitch = useCallback(
    (pairId: string) => {
      onSwitch(pairId)
      handleClose()
    },
    [onSwitch, handleClose],
  )

  const handleAddPair = useCallback(() => {
    onAddPair()
    handleClose()
  }, [onAddPair, handleClose])

  const buttonLabel = loading
    ? 'Loading...'
    : activePair
      ? `${activePair.sourceLang} → ${activePair.targetLang}`
      : 'Select pair'

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleOpen}
        disabled={loading}
        aria-label="Select language pair"
        aria-haspopup="true"
        aria-expanded={open}
        sx={{
          borderColor: 'divider',
          color: 'text.primary',
          minWidth: 140,
          justifyContent: 'flex-start',
          gap: 1,
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {buttonLabel}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: { minWidth: 200, borderRadius: 2 },
        }}
      >
        {pairs.length === 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No language pairs yet
            </Typography>
          </Box>
        )}

        {pairs.map((pair) => (
          <MenuItem
            key={pair.id}
            onClick={() => handleSwitch(pair.id)}
            selected={pair.id === activePair?.id}
          >
            {pair.id === activePair?.id && (
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon fontSize="small" color="primary" />
              </ListItemIcon>
            )}
            <ListItemText
              inset={pair.id !== activePair?.id}
              primary={`${pair.sourceLang} → ${pair.targetLang}`}
              secondary={`${pair.sourceCode} → ${pair.targetCode}`}
              primaryTypographyProps={{ fontWeight: pair.id === activePair?.id ? 700 : 400 }}
            />
          </MenuItem>
        ))}

        {pairs.length > 0 && <Divider />}

        <MenuItem onClick={handleAddPair}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Add pair"
            primaryTypographyProps={{ color: 'primary', fontWeight: 600 }}
          />
        </MenuItem>
      </Menu>
    </>
  )
}
