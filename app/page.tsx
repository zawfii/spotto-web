export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#fbfaeb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ color: '#03271a', marginBottom: '12px' }}>Welcome to Spotto</h1>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: '400px' }}>
        Share and discover food lists from your friends.
      </p>
      <p style={{ color: '#999', marginTop: '20px', fontSize: '14px' }}>
        <a href="https://spotto.com" style={{ color: '#03271a' }}>
          Download the app
        </a>
      </p>
    </main>
  );
}
