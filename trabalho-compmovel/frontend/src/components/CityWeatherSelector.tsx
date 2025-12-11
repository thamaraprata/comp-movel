import { useEffect, useState } from "react";
import { MapPin, Cloud } from "lucide-react";
import { getCities, getWeatherData, getWeatherDescription, type WeatherData, type City } from "../services/weatherApi";
import { generateWeatherTips } from "../services/api";
import type { AITip } from "../types";

interface CityWeatherSelectorProps {
  onCityChange?: (city: string) => void;
}

export function CityWeatherSelector({ onCityChange }: CityWeatherSelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("São Paulo");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [description, setDescription] = useState<string>("");
  const [tips, setTips] = useState<AITip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de cidades ao montar
  useEffect(() => {
    async function loadCities() {
      try {
        const citiesList = await getCities();
        setCities(citiesList);
      } catch (err) {
        console.error("Erro ao carregar cidades:", err);
      }
    }
    loadCities();
  }, []);

  // Carregar dados de clima quando mudar de cidade
  useEffect(() => {
    async function loadWeatherData() {
      try {
        setLoading(true);
        setError(null);

        // Obter dados de clima
        const weatherData = await getWeatherData(selectedCity);
        if (weatherData) {
          setWeather(weatherData);

          // Obter descrição formatada
          const desc = await getWeatherDescription(selectedCity);
          setDescription(desc);

          // Obter dicas personalizadas
          const weatherTips = await generateWeatherTips({
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            location: selectedCity,
            conditions: weatherData.conditions
          });
          setTips(weatherTips);
        } else {
          setError("Não foi possível carregar dados de clima");
        }
      } catch (err) {
        console.error("Erro ao carregar dados de clima:", err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    loadWeatherData();
    onCityChange?.(selectedCity);
  }, [selectedCity, onCityChange]);

  if (cities.length === 0) {
    return null;
  }

  const selectedCityData = cities.find(c => c.name === selectedCity);

  return (
    <div className="space-y-4">
      {/* Seletor de Cidades */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-500" />
          <label className="font-semibold text-sm">Selecione uma Cidade</label>
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {/* Agrupar cidades por região */}
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

      {/* Informações de Clima */}
      {loading ? (
        <div className="card p-6 text-center text-sm text-slate-500">
          Carregando dados de clima...
        </div>
      ) : error ? (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : weather ? (
        <div className="card p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-start gap-3 mb-3">
            <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {selectedCityData?.name} ({selectedCityData?.state})
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dicas Personalizadas para a Cidade */}
      {!loading && tips.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            💡 Dicas para {selectedCity}
          </h3>
          <div className="grid gap-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="card p-3 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                      {tip.title}
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      {tip.description}
                    </p>
                    {tip.actions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tip.actions.slice(0, 2).map((action, idx) => (
                          <li key={idx} className="text-xs text-amber-700 dark:text-amber-400">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota sobre atualização */}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        ⏱️ Dados atualizados a cada 5 minutos via OpenWeather API
      </p>
    </div>
  );
}
