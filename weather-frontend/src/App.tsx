import { useEffect, useState } from 'react';

interface WeatherLog {
  _id: string;
  temp_c: number;
  humidity: number;
  wind_speed: number;
  timestamp: string;
}

// Interface para a resposta da IA
interface AIInsight {
  summary: string;
  details: string[];
  generated_at: string;
}

function App() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://upgraded-umbrella-67rjr6644jp3x4gj-3000.app.github.dev';

  const fetchData = async () => {
    try {
      // 1. Buscar Logs
      const resLogs = await fetch(`${API_BASE}/weather`);
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        if (Array.isArray(dataLogs)) setLogs(dataLogs);
      }

      // 2. Buscar Insights de IA
      const resInsight = await fetch(`${API_BASE}/weather/insights`);
      if (resInsight.ok) {
        const dataInsight = await resInsight.json();
        setInsight(dataInsight);
      }

    } catch (error) {
      console.error("Erro ao conectar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async () => {
    try {
      // Usando fetch para preparar para a Autenticação (passaremos headers depois)
      const response = await fetch(`${API_BASE}/weather/export`, {
        method: 'GET',
        // headers: { 'Authorization': `Bearer ${token}` } // Futuro
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_clima_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Erro ao baixar CSV", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            🌤️ GDASH Monitor <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded">v1.0</span>
          </h1>
          <button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            📂 Exportar CSV
          </button>
        </header>

        {loading && !insight ? (
          <div className="text-center py-10 text-slate-500">Carregando inteligência...</div>
        ) : (
          <div className="space-y-6">
            {insight && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-[1.01] transition-transform">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🤖</div>
                  <div>
                    <h2 className="text-lg font-bold opacity-90 uppercase tracking-wider text-indigo-100">Análise de IA</h2>
                    <p className="text-2xl font-bold mt-1">{insight.summary}</p>
                    <div className="mt-4 bg-white/10 p-3 rounded-lg text-sm text-indigo-100">
                      <strong>Detalhes observados:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {insight.details.map((det, idx) => (
                          <li key={idx}>{det}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid de Dados */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Card Temperatura */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Temperatura Atual</p>
                <p className="text-5xl font-bold text-slate-800 mt-2">
                  {logs[0]?.temp_c ?? '--'}°C
                </p>
              </div>

              {/* Card Umidade */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Umidade Relativa</p>
                <p className="text-5xl font-bold text-blue-500 mt-2">
                  {logs[0]?.humidity ?? '--'}%
                </p>
              </div>

              {/* Card Vento */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-medium">Velocidade do Vento</p>
                <p className="text-5xl font-bold text-teal-500 mt-2">
                  {logs[0]?.wind_speed ?? '--'} <span className="text-xl">km/h</span>
                </p>
              </div>
            </div>

            {/* Tabela de Histórico */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-700">Histórico de Coletas</h3>
              </div>
              <div className="overflow-x-auto">
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
                    {logs.slice(0, 5).map((log) => (
                      <tr key={log._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">{log.temp_c}°C</td>
                        <td className="px-6 py-4">{log.humidity}%</td>
                        <td className="px-6 py-4">{log.wind_speed} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;