import { Routes, Route } from 'react-router';
import PrefsGeneral from './PrefsGeneral';
import PrefsAdvanced from './PrefsAdvanced';
import PrefsAppSettingsGeneral from './PrefsAppSettingsGeneral';
import PrefsApplicationStorage from './PrefsApplicationStorage';
import PrefsGit from './PrefsGit';
import PrefsLogging from './PrefsLogging';
import PrefsHugo from './PrefsHugo';
import PrefsVariables from './PrefsVariables';

export const PrefsRouted = () => {
  return (
    <Routes>
      <Route path="general" element={<PrefsGeneral />} />
      <Route path="advanced" element={<PrefsAdvanced />} />
      <Route path="appsettings-general" element={<PrefsAppSettingsGeneral />} />
      <Route path="storage" element={<PrefsApplicationStorage />} />
      <Route path="git" element={<PrefsGit />} />
      <Route path="logging" element={<PrefsLogging />} />
      <Route path="hugo" element={<PrefsHugo />} />
      <Route path="variables" element={<PrefsVariables />} />
      <Route path="*" element={<PrefsGeneral />} />
    </Routes>
  );
};
