-- Schema inicial do banco de dados
-- Executado automaticamente quando o container PostgreSQL é criado

-- Tabela de registros climáticos
CREATE TABLE IF NOT EXISTS weather_records (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    feels_like DECIMAL(5, 2) NOT NULL,
    humidity INTEGER NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
    wind_speed DECIMAL(5, 2) NOT NULL,
    conditions TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_city_timestamp ON weather_records(city, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timestamp ON weather_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_city ON weather_records(city);

-- Tabela de dicas geradas pela IA
CREATE TABLE IF NOT EXISTS weather_tips (
    id SERIAL PRIMARY KEY,
    weather_record_id INTEGER REFERENCES weather_records(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_record ON weather_tips(weather_record_id);
CREATE INDEX IF NOT EXISTS idx_city_created ON weather_tips(city, created_at DESC);

-- Tabela de estatísticas agregadas (para performance)
CREATE TABLE IF NOT EXISTS weather_stats (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    temp_min DECIMAL(5, 2),
    temp_max DECIMAL(5, 2),
    temp_avg DECIMAL(5, 2),
    humidity_min INTEGER,
    humidity_max INTEGER,
    humidity_avg DECIMAL(5, 2),
    wind_speed_max DECIMAL(5, 2),
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (city, country_code, date)
);

CREATE INDEX IF NOT EXISTS idx_city_date ON weather_stats(city, date DESC);

-- Função para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION update_weather_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO weather_stats (
        city,
        country_code,
        date,
        temp_min,
        temp_max,
        temp_avg,
        humidity_min,
        humidity_max,
        humidity_avg,
        wind_speed_max,
        record_count
    )
    VALUES (
        NEW.city,
        NEW.country_code,
        DATE(NEW.timestamp),
        NEW.temperature,
        NEW.temperature,
        NEW.temperature,
        NEW.humidity,
        NEW.humidity,
        NEW.humidity,
        NEW.wind_speed,
        1
    )
    ON CONFLICT (city, country_code, date)
    DO UPDATE SET
        temp_min = LEAST(weather_stats.temp_min, NEW.temperature),
        temp_max = GREATEST(weather_stats.temp_max, NEW.temperature),
        temp_avg = (weather_stats.temp_avg * weather_stats.record_count + NEW.temperature) / (weather_stats.record_count + 1),
        humidity_min = LEAST(weather_stats.humidity_min, NEW.humidity),
        humidity_max = GREATEST(weather_stats.humidity_max, NEW.humidity),
        humidity_avg = (weather_stats.humidity_avg * weather_stats.record_count + NEW.humidity) / (weather_stats.record_count + 1),
        wind_speed_max = GREATEST(weather_stats.wind_speed_max, NEW.wind_speed),
        record_count = weather_stats.record_count + 1,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas ao inserir novo registro
CREATE TRIGGER trigger_update_weather_stats
    AFTER INSERT ON weather_records
    FOR EACH ROW
    EXECUTE FUNCTION update_weather_stats();

-- Comentários nas tabelas
COMMENT ON TABLE weather_records IS 'Histórico completo de registros climáticos';
COMMENT ON TABLE weather_tips IS 'Dicas personalizadas geradas pela IA Gemini';
COMMENT ON TABLE weather_stats IS 'Estatísticas agregadas por dia (cache)';

-- Dados iniciais fake (últimos 30 dias)
-- Gerando dados históricos para São Paulo
DO $$
DECLARE
    i INTEGER;
    base_temp DECIMAL;
    base_humidity INTEGER;
    temp_variation DECIMAL;
    humidity_variation INTEGER;
    record_timestamp TIMESTAMP;
BEGIN
    -- Gerar dados para os últimos 30 dias (a cada hora)
    FOR i IN 0..(30 * 24) LOOP
        record_timestamp := NOW() - (i || ' hours')::INTERVAL;

        -- Variação senoidal para simular ciclo dia/noite
        base_temp := 22 + 8 * SIN((i % 24) * PI() / 12);
        temp_variation := (RANDOM() - 0.5) * 3;

        base_humidity := 60 + 20 * SIN((i % 24 + 6) * PI() / 12);
        humidity_variation := FLOOR((RANDOM() - 0.5) * 15);

        INSERT INTO weather_records (
            city,
            country_code,
            temperature,
            feels_like,
            humidity,
            wind_speed,
            conditions,
            timestamp,
            created_at
        ) VALUES (
            'São Paulo',
            'BR',
            ROUND(CAST(base_temp + temp_variation AS numeric), 2),
            ROUND(CAST(base_temp + temp_variation - 1 AS numeric), 2),
            GREATEST(0, LEAST(100, base_humidity + humidity_variation)),
            ROUND(CAST(5 + RANDOM() * 15 AS numeric), 2),
            CASE
                WHEN RANDOM() < 0.3 THEN 'céu limpo'
                WHEN RANDOM() < 0.6 THEN 'parcialmente nublado'
                WHEN RANDOM() < 0.8 THEN 'nublado'
                ELSE 'chuva leve'
            END,
            record_timestamp,
            record_timestamp
        );
    END LOOP;

    -- Gerar dados para Goiânia (últimos 15 dias)
    FOR i IN 0..(15 * 24) LOOP
        record_timestamp := NOW() - (i || ' hours')::INTERVAL;

        base_temp := 25 + 7 * SIN((i % 24) * PI() / 12);
        temp_variation := (RANDOM() - 0.5) * 4;

        base_humidity := 50 + 25 * SIN((i % 24 + 6) * PI() / 12);
        humidity_variation := FLOOR((RANDOM() - 0.5) * 20);

        INSERT INTO weather_records (
            city,
            country_code,
            temperature,
            feels_like,
            humidity,
            wind_speed,
            conditions,
            timestamp,
            created_at
        ) VALUES (
            'Goiânia',
            'BR',
            ROUND(CAST(base_temp + temp_variation AS numeric), 2),
            ROUND(CAST(base_temp + temp_variation - 0.5 AS numeric), 2),
            GREATEST(0, LEAST(100, base_humidity + humidity_variation)),
            ROUND(CAST(8 + RANDOM() * 20 AS numeric), 2),
            CASE
                WHEN RANDOM() < 0.5 THEN 'céu limpo'
                WHEN RANDOM() < 0.8 THEN 'parcialmente nublado'
                ELSE 'nublado'
            END,
            record_timestamp,
            record_timestamp
        );
    END LOOP;

    -- Gerar dados para Rio de Janeiro (últimos 7 dias)
    FOR i IN 0..(7 * 24) LOOP
        record_timestamp := NOW() - (i || ' hours')::INTERVAL;

        base_temp := 26 + 6 * SIN((i % 24) * PI() / 12);
        temp_variation := (RANDOM() - 0.5) * 3;

        base_humidity := 70 + 15 * SIN((i % 24 + 6) * PI() / 12);
        humidity_variation := FLOOR((RANDOM() - 0.5) * 10);

        INSERT INTO weather_records (
            city,
            country_code,
            temperature,
            feels_like,
            humidity,
            wind_speed,
            conditions,
            timestamp,
            created_at
        ) VALUES (
            'Rio de Janeiro',
            'BR',
            ROUND(CAST(base_temp + temp_variation AS numeric), 2),
            ROUND(CAST(base_temp + temp_variation + 1 AS numeric), 2),
            GREATEST(0, LEAST(100, base_humidity + humidity_variation)),
            ROUND(CAST(10 + RANDOM() * 18 AS numeric), 2),
            CASE
                WHEN RANDOM() < 0.4 THEN 'céu limpo'
                WHEN RANDOM() < 0.7 THEN 'parcialmente nublado'
                WHEN RANDOM() < 0.9 THEN 'nublado'
                ELSE 'chuva'
            END,
            record_timestamp,
            record_timestamp
        );
    END LOOP;
END$$;

-- Verificar dados inseridos
SELECT city, COUNT(*) as total_records
FROM weather_records
GROUP BY city;
