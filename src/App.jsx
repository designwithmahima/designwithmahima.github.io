import React, { useEffect, useRef } from 'react'; //
import { markup } from './legacyMarkup.js';

export default function App() {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    import('./legacy.js');
  }, []);
  
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}