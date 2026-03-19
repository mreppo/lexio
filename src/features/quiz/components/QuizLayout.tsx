/**
 * QuizLayout - shared chrome rendered by both TypeQuizContent and ChoiceQuizContent.
 *
 * Renders:
 *   - SessionProgress bar
 *   - Direction chip (fromLang → toLang)
 *   - Word card (Paper with the question text and optional notes)
 *   - children (the mode-specific input area)
 *   - End session button
 *
 * This is a thin, stateless wrapper. All logic lives in the parent content components.
 */

import type { ReactNode } from 'react'
import { Box, Button, Chip, Paper, Typography } from '@mui/material'
import { SessionProgress } from './SessionProgress'

interface QuizLayoutProps {
  readonly fromLang: string
  readonly toLang: string
  readonly questionText: string
  readonly notes?: string | null
  readonly wordsCompleted: number
  readonly sessionGoal: number
  readonly correctCount: number
  readonly onEndSession: () => void
  readonly children: ReactNode
}

export function QuizLayout({
  fromLang,
  toLang,
  questionText,
  notes,
  wordsCompleted,
  sessionGoal,
  correctCount,
  onEndSession,
  children,
}: QuizLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SessionProgress completed={wordsCompleted} total={sessionGoal} correct={correctCount} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={`${fromLang} → ${toLang}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
          aria-label={`Translating from ${fromLang} to ${toLang}`}
        />
      </Box>

      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography
          variant="h4"
          component="p"
          fontWeight={700}
          sx={{ wordBreak: 'break-word' }}
          aria-label={`Translate: ${questionText}`}
        >
          {questionText}
        </Typography>
        {notes != null && notes !== '' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            {notes}
          </Typography>
        )}
      </Paper>

      {children}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="text"
          size="small"
          color="inherit"
          onClick={onEndSession}
          sx={{ color: 'text.disabled', fontSize: '0.75rem' }}
        >
          End session
        </Button>
      </Box>
    </Box>
  )
}
