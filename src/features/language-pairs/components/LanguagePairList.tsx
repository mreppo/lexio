import { useState, useCallback } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Box,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { LanguagePair } from '@/types'
import { DeletePairDialog } from './DeletePairDialog'

export interface LanguagePairListProps {
  readonly pairs: readonly LanguagePair[]
  readonly activePairId: string | null
  readonly onDelete: (pairId: string) => Promise<void>
}

/**
 * List view of all language pairs with active indicator and delete action.
 * Used in the settings/management screen.
 */
export function LanguagePairList({ pairs, activePairId, onDelete }: LanguagePairListProps) {
  const [pairToDelete, setPairToDelete] = useState<LanguagePair | null>(null)

  const handleDeleteRequest = useCallback((pair: LanguagePair) => {
    setPairToDelete(pair)
  }, [])

  const handleDeleteClose = useCallback(() => {
    setPairToDelete(null)
  }, [])

  if (pairs.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No language pairs yet. Create your first pair to get started.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <List disablePadding>
          {pairs.map((pair, index) => (
            <ListItem key={pair.id} divider={index < pairs.length - 1} sx={{ py: 1.5, pr: 7 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {pair.sourceLang} → {pair.targetLang}
                    </Typography>
                    {pair.id === activePairId && (
                      <Chip
                        label="Active"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={`${pair.sourceCode} → ${pair.targetCode}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label={`Delete ${pair.sourceLang} to ${pair.targetLang} pair`}
                  onClick={() => handleDeleteRequest(pair)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <DeletePairDialog
        open={pairToDelete !== null}
        pair={pairToDelete}
        onClose={handleDeleteClose}
        onConfirm={onDelete}
      />
    </>
  )
}
