import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getInstanceSetting, updateInstanceSettings } from '../../api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const VALID_NAME_REGEX = /^[A-Za-z0-9_]+$/;

function PrefsVariables() {
  const { addSnackMessage } = useSnackbar();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const vars = await getInstanceSetting('variables');
      setVariables((vars as Record<string, string>) ?? {});
    } catch (error) {
      console.error('Failed to load variables:', error);
      addSnackMessage('Failed to load variables', { severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveVariables = async (updated: Record<string, string>) => {
    try {
      setSaving(true);
      await updateInstanceSettings({ variables: updated });
      setVariables(updated);
      addSnackMessage('Variables saved', { severity: 'success' });
    } catch (error) {
      console.error('Failed to save variables:', error);
      addSnackMessage(`Failed to save variables: ${(error as Error).message}`, { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    if (!VALID_NAME_REGEX.test(trimmedName)) {
      setNameError('Only letters, numbers, and underscores allowed');
      return;
    }
    if (trimmedName in variables) {
      setNameError('Variable already exists');
      return;
    }
    setNameError('');
    const updated = { ...variables, [trimmedName]: newValue };
    setNewName('');
    setNewValue('');
    saveVariables(updated);
  };

  const handleDelete = (name: string) => {
    const updated = { ...variables };
    delete updated[name];
    saveVariables(updated);
  };

  const handleValueChange = (name: string, value: string) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
  };

  const handleValueBlur = (name: string) => {
    saveVariables(variables);
  };

  const entries = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Box sx={{ padding: '20px', height: '100%' }}>
      <Typography variant="h4">Build Action Variables</Typography>

      <Box my={2} mx={1}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Global variables override default values defined in site model build actions.
          Use these to configure machine-specific paths (e.g., executable locations)
          without modifying shared model files. Variables are referenced as <code>%VARIABLE_NAME</code> in build action commands.
        </Typography>

        {entries.length > 0 ? (
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(([name, value]) => (
                <TableRow key={name}>
                  <TableCell>
                    <code>{name}</code>
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={value}
                      onChange={(e) => handleValueChange(name, e.target.value)}
                      onBlur={() => handleValueBlur(name)}
                      size="small"
                      fullWidth
                      disabled={saving}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(name)}
                      disabled={saving}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !loading && (
          <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No variables defined. Add a variable to override build action defaults
              for this machine.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label="Variable Name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value.toUpperCase());
              setNameError('');
            }}
            size="small"
            error={!!nameError}
            helperText={nameError}
            placeholder="e.g. NIX_EXEC"
            disabled={loading || saving}
          />
          <TextField
            label="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            size="small"
            placeholder="e.g. /usr/bin/nix"
            disabled={loading || saving}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={loading || saving}
            sx={{ mt: '1px' }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PrefsVariables;
