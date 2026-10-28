import React from 'react';
import {createRoot} from 'react-dom/client';
import PlaceAdventure from '../src/components/world-learning/place-v1/PlaceAdventure.jsx';
import '../src/index.css';
createRoot(document.getElementById('root')).render(<PlaceAdventure initialLevel="elementary" countryCode="rw"/>);
