import { useEffect, useState } from 'react';

interface WeatherLog {
  _id: string;
  temp_c: number;
  humidity: number;
  wind_speed: number;
  timestamp: string;
}

interface AIInsight {
  summary: string;
  details: string[];
  generated_at: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Use a URL do seu ambiente
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // --- Funções de Autenticação ---
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access_token;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        setErrorMsg('');
      } else {
        setErrorMsg('Usuário ou senha inválidos');
      }
    } catch (error) {
      setErrorMsg('Erro ao conectar com o servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setLogs([]);
    setInsight(null);
  };

  // --- Funções de Dados ---

  const fetchData = async () => {
    if (!token) return;

    // setLoading(true); // Opcional: pode causar flicker se polling for rápido
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const resLogs = await fetch(`${API_BASE}/weather`, { headers });
      if (resLogs.status === 401) { handleLogout(); return; } // Token expirou
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        if (Array.isArray(dataLogs)) setLogs(dataLogs);
      }

      const resInsight = await fetch(`${API_BASE}/weather/insights`, { headers });
      if (resInsight.ok) {
        const dataInsight = await resInsight.json();
        setInsight(dataInsight);
      }

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE}/weather/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_clima.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Erro no download", error);
    }
  };

  // --- Efeitos ---

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // --- Renderização ---

  // 1. Se não tiver token, mostra TELA DE LOGIN
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">🌤️ GDASH Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: admin123"
              />
            </div>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Entrar
            </button>
          </form>
          <p className="mt-4 text-xs text-center text-slate-400">Dica: Tente admin / admin123</p>
        </div>
      </div>
    );
  }

  // 2. Se tiver token, mostra o DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            🌤️ GDASH Monitor <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded">v1.0</span>
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              📂 CSV
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {loading && !logs.length ? (
          <div className="text-center py-10 text-slate-500">Carregando dados...</div>
        ) : (
          <div className="space-y-6">
            {insight && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🤖</div>
                  <div>
                    <h2 className="text-lg font-bold opacity-90 uppercase tracking-wider text-indigo-100">Análise de IA</h2>
                    <p className="text-2xl font-bold mt-1">{insight.summary}</p>
                    <div className="mt-4 bg-white/10 p-3 rounded-lg text-sm text-indigo-100">
                      <strong>Detalhes:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {insight.details?.map((det, idx) => <li key={idx}>{det}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Temperatura</p>
                <p className="text-5xl font-bold text-slate-800 mt-2">{logs[0]?.temp_c ?? '--'}°C</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Umidade</p>
                <p className="text-5xl font-bold text-blue-500 mt-2">{logs[0]?.humidity ?? '--'}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Vento</p>
                <p className="text-5xl font-bold text-teal-500 mt-2">{logs[0]?.wind_speed ?? '--'} km/h</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-6 py-3">Horário</th>
                      <th className="px-6 py-3">Temp</th>
                      <th className="px-6 py-3">Umidade</th>
                      <th className="px-6 py-3">Vento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs?.slice(0, 5).map((log) => (
                      <tr key={log._id} className="border-b">
                        <td className="px-6 py-4">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-6 py-4">{log.temp_c}°C</td>
                        <td className="px-6 py-4">{log.humidity}%</td>
                        <td className="px-6 py-4">{log.wind_speed} km/h</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;