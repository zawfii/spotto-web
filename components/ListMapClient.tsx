'use client';

import dynamic from 'next/dynamic';

const ListMap = dynamic(() => import('./ListMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '260px', backgroundColor: '#D0CCC6' }} />,
});

export default ListMap;
