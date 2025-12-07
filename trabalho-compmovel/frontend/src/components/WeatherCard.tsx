import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Cloud, Droplets, Wind, Thermometer, RefreshCw, AlertCircle, MapPin } from "lucide-react";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
}

interface WeatherRecord {
  city: string;
  countryCode: string;
  data: WeatherData;
  timestamp: number;
  tips?: string[];
}

interface City {
  name: string;
  state: string;
  country: string;
  countryCode: string;
}

interface WeatherCardProps {
  onCityChange?: (city: string) => void;
}

export function WeatherCard({ onCityChange }: WeatherCardProps = { onCityChange: undefined }) {
  const [weather, setWeather] = useState<WeatherRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(300); // 5 minutos em segundos
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("São Paulo");
  const socket = useSocket();

  // Notificar o pai quando a cidade mudar
  const handleCityChange = (city: string) => {
    console.log(`[WeatherCard] Cidade selecionada: ${city}`);
    setSelectedCity(city);
    onCityChange?.(city);
  };

  // Carregar lista de cidades
  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch("/api/weather/cities");
        if (response.ok) {
          const data = await response.json();
          setCities(data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
      }
    }
    loadCities();
  }, []);

  useEffect(() => {
    // Fetch dados iniciais
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ city: selectedCity });
        const response = await fetch(`/api/weather?${params}`);
        if (response.ok) {
          const data = await response.json();
          setWeather(data.data);
          setCountdown(300); // Reset contador
        }
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Ouvir atualizações em tempo real via WebSocket
    if (socket) {
      socket.on("weather:updated", (record: WeatherRecord) => {
        setWeather(record);
        setCountdown(300); // Reset contador quando atualizado
      });
    }

    return () => {
      if (socket) {
        socket.off("weather:updated");
      }
    };
  }, [socket, selectedCity]);

  // Contador regressivo para próxima atualização
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getWeatherIcon = (conditions: string) => {
    const lower = conditions.toLowerCase();
    if (lower.includes("chuva") || lower.includes("rain")) return "🌧️";
    if (lower.includes("nuvem") || lower.includes("cloud")) return "☁️";
    if (lower.includes("sol") || lower.includes("sunny")) return "☀️";
    if (lower.includes("nevoeiro") || lower.includes("fog")) return "🌫️";
    if (lower.includes("neve") || lower.includes("snow")) return "❄️";
    return "🌤️";
  };

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Carregando dados do clima...
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card p-6 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800 dark:text-orange-200">
            Dados de clima não disponíveis. Configure a API do OpenWeather.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Seletor de Cidades */}
      {cities.length > 0 && (
        <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Selecione a Cidade
            </label>
          </div>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <optgroup label="🌍 Nordeste">
              {cities.filter(c => ['BA', 'CE', 'PE', 'AL', 'PI', 'MA', 'RN', 'PB', 'SE'].includes(c.state)).map((city) => (
                <option key={`${city.name}-${city.state}`} value={city.name}>
                  {city.name} ({city.state})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏢 Centro-Oeste">
              {cities.filter(c => ['DF', 'GO', 'MT', 'MS'].includes(c.state)).map((city) => (
                <option key={`${city.name}-${city.state}`} value={city.name}>
                  {city.name} ({city.state})
                </option>
              ))}
            </optgroup>
            <optgroup label="🌳 Norte">
              {cities.filter(c => ['AM', 'PA', 'RR', 'AP', 'TO', 'RO', 'AC'].includes(c.state)).map((city) => (
                <option key={`${city.name}-${city.state}`} value={city.name}>
                  {city.name} ({city.state})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏙️ Sudeste">
              {cities.filter(c => ['SP', 'RJ', 'MG', 'ES'].includes(c.state)).map((city) => (
                <option key={`${city.name}-${city.state}`} value={city.name}>
                  {city.name} ({city.state})
                </option>
              ))}
            </optgroup>
            <optgroup label="⛰️ Sul">
              {cities.filter(c => ['PR', 'RS', 'SC'].includes(c.state)).map((city) => (
                <option key={`${city.name}-${city.state}`} value={city.name}>
                  {city.name} ({city.state})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getWeatherIcon(weather.data.conditions)}</span>
            <div>
              <h2 className="text-2xl font-bold">{weather.city}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {weather.data.conditions}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Próxima atualização em
            </div>
            <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
              {formatCountdown(countdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid responsivo de dados */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        {/* Temperatura */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Temperatura
            </span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {weather.data.temperature}°
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sente-se {weather.data.feelsLike}°
          </p>
        </div>

        {/* Umidade */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Umidade
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {weather.data.humidity}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {weather.data.humidity < 30
              ? "Seco"
              : weather.data.humidity > 70
                ? "Úmido"
                : "Normal"}
          </p>
        </div>

        {/* Vento */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Vento
            </span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {weather.data.windSpeed}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">km/h</p>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Status
            </span>
          </div>
          <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
            {weather.data.windSpeed < 10
              ? "Calmo"
              : weather.data.windSpeed < 25
                ? "Moderado"
                : "Ventoso"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {new Date(weather.timestamp).toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>

    </div>
  );
}
