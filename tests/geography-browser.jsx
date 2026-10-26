// Local QA entry only; not included in Vite's production inputs.
import React from 'react';
import {createRoot} from 'react-dom/client';
import CountryPlaceAdventure from '../src/components/world-learning/place-v1/CountryPlaceAdventure.jsx';
import WorldMissionPanel from '../src/components/world-learning/WorldMissionPanel.jsx';
import '../src/index.css';
const query=new URLSearchParams(location.search);
createRoot(document.getElementById('root')).render(query.has('panel')?<WorldMissionPanel countryCode={query.get('country')||'af'} countryNameEn="QA"/>:<CountryPlaceAdventure countryCode={query.get('country')||'af'} initialLevel={query.get('level')||'elementary'}/>);
