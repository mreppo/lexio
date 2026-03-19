import { useCallback } from 'react'
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InventoryIcon from '@mui/icons-material/Inventory'
import type { Word, WordProgress } from '@/types'
import { getConfidenceBucket, CONFIDENCE_LABELS, CONFIDENCE_COLORS } from '../constants'

export interface WordListItemProps {
  readonly word: Word
  readonly progress: WordProgress | null
  readonly selected: boolean
  readonly selectionMode: boolean
  readonly onToggleSelect: (wordId: string) => void
  readonly onEdit: (word: Word) => void
  readonly onDelete: (word: Word) => void
}

/**
 * Single row in the word list.
 * Shows source/target, optional confidence chip, starter-pack badge, edit/delete actions.
 */
export function WordListItem({
  word,
  progress,
  selected,
  selectionMode,
  onToggleSelect,
  onEdit,
  onDelete,
}: WordListItemProps) {
  const confidenceBucket = getConfidenceBucket(progress?.confidence ?? null)

  const handleToggleSelect = useCallback(() => {
    onToggleSelect(word.id)
  }, [onToggleSelect, word.id])

  const handleEdit = useCallback(() => {
    onEdit(word)
  }, [onEdit, word])

  const handleDelete = useCallback(() => {
    onDelete(word)
  }, [onDelete, word])

  return (
    <ListItem
      disablePadding
      sx={{ py: 0.5, pr: selectionMode ? 1 : 10 }}
      onClick={selectionMode ? handleToggleSelect : undefined}
      role={selectionMode ? 'checkbox' : undefined}
      aria-checked={selectionMode ? selected : undefined}
    >
      {selectionMode && (
        <Checkbox
          edge="start"
          checked={selected}
          onChange={handleToggleSelect}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          disableRipple
          inputProps={{ 'aria-label': `Select ${word.source}` }}
          sx={{ ml: 0.5, mr: 0 }}
        />
      )}

      <ListItemText
        sx={{ my: 0.5, ml: selectionMode ? 0 : 2 }}
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body1" component="span" fontWeight={500}>
              {word.source}
            </Typography>
            <Typography variant="body2" component="span" color="text.secondary">
              →
            </Typography>
            <Typography variant="body1" component="span">
              {word.target}
            </Typography>

            {word.isFromPack && (
              <Tooltip title="From starter pack">
                <Chip
                  icon={<InventoryIcon sx={{ fontSize: 12 }} />}
                  label="Pack"
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', borderRadius: 1 }}
                  aria-label="From starter pack"
                />
              </Tooltip>
            )}

            {progress !== null && (
              <Chip
                label={CONFIDENCE_LABELS[confidenceBucket]}
                size="small"
                color={CONFIDENCE_COLORS[confidenceBucket]}
                sx={{ height: 18, fontSize: '0.65rem' }}
                aria-label={`Confidence: ${CONFIDENCE_LABELS[confidenceBucket]}`}
              />
            )}
          </Box>
        }
        secondary={
          word.notes || word.tags.length > 0 ? (
            <Box sx={{ mt: 0.25 }}>
              {word.notes && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {word.notes}
                </Typography>
              )}
              {word.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                  {word.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.6rem', borderRadius: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : null
        }
      />

      {!selectionMode && (
        <ListItemSecondaryAction>
          <IconButton size="small" aria-label={`Edit ${word.source}`} onClick={handleEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Delete ${word.source}`}
            onClick={handleDelete}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}
