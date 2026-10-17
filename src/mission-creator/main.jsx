import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MissionCreator from './MissionCreator.jsx';
import './missionCreator.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><MissionCreator /></StrictMode>,
);
