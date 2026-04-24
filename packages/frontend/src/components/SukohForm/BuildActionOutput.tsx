import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const MAX_LINES = 500;

interface BuildOutput {
  actionName: string;
  success: boolean;
  stdout: string;
  stderr: string;
}

function truncateOutput(text: string): { text: string; truncated: boolean } {
  const lines = text.split('\n');
  if (lines.length <= MAX_LINES) {
    return { text, truncated: false };
  }
  return {
    text: lines.slice(-MAX_LINES).join('\n'),
    truncated: true,
  };
}

export function BuildActionOutput({
  output,
  onDismiss,
}: {
  output: BuildOutput;
  onDismiss: () => void;
}) {
  const stdout = truncateOutput(output.stdout);
  const stderr = truncateOutput(output.stderr);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: output.success ? 'divider' : 'error.main',
        borderRadius: 1,
        mt: 2,
        mb: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          bgcolor: output.success ? 'action.hover' : 'error.dark',
          color: output.success ? 'text.primary' : 'error.contrastText',
        }}
      >
        <Typography variant="subtitle2">
          {output.actionName} — {output.success ? 'completed' : 'failed'}
        </Typography>
        <IconButton size="small" onClick={onDismiss} color="inherit">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {output.stdout && (
        <Box sx={{ px: 2, py: 1, maxHeight: 300, overflow: 'auto' }}>
          {stdout.truncated && (
            <Typography variant="caption" color="text.secondary">
              Output truncated to last {MAX_LINES} lines
            </Typography>
          )}
          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {stdout.text}
          </pre>
        </Box>
      )}

      {output.stderr && (
        <Box sx={{ px: 2, py: 1, maxHeight: 200, overflow: 'auto', bgcolor: 'error.dark' }}>
          {stderr.truncated && (
            <Typography variant="caption" color="error.contrastText">
              Error output truncated to last {MAX_LINES} lines
            </Typography>
          )}
          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: '#ffcdd2' }}>
            {stderr.text}
          </pre>
        </Box>
      )}
    </Box>
  );
}

export type { BuildOutput };
