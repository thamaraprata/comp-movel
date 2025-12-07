-- Seed simplificado para testar o banco
-- Inserir alguns registros fake para São Paulo (últimas 24 horas, a cada hora)

-- Últimas 24 horas para São Paulo
INSERT INTO weather_records (city, country_code, temperature, feels_like, humidity, wind_speed, conditions, timestamp) VALUES
('São Paulo', 'BR', 18.5, 17.2, 75, 12.3, 'céu limpo', NOW() - INTERVAL '24 hours'),
('São Paulo', 'BR', 19.2, 18.0, 72, 11.5, 'céu limpo', NOW() - INTERVAL '23 hours'),
('São Paulo', 'BR', 20.1, 19.0, 68, 10.2, 'parcialmente nublado', NOW() - INTERVAL '22 hours'),
('São Paulo', 'BR', 21.5, 20.5, 65, 9.8, 'parcialmente nublado', NOW() - INTERVAL '21 hours'),
('São Paulo', 'BR', 23.0, 22.0, 62, 8.5, 'céu limpo', NOW() - INTERVAL '20 hours'),
('São Paulo', 'BR', 24.5, 23.5, 60, 7.2, 'céu limpo', NOW() - INTERVAL '19 hours'),
('São Paulo', 'BR', 25.8, 25.0, 58, 6.5, 'céu limpo', NOW() - INTERVAL '18 hours'),
('São Paulo', 'BR', 26.5, 25.8, 55, 5.8, 'céu limpo', NOW() - INTERVAL '17 hours'),
('São Paulo', 'BR', 27.0, 26.5, 53, 5.2, 'parcialmente nublado', NOW() - INTERVAL '16 hours'),
('São Paulo', 'BR', 27.2, 26.8, 52, 4.8, 'parcialmente nublado', NOW() - INTERVAL '15 hours'),
('São Paulo', 'BR', 27.0, 26.5, 53, 5.0, 'nublado', NOW() - INTERVAL '14 hours'),
('São Paulo', 'BR', 26.5, 26.0, 55, 5.5, 'nublado', NOW() - INTERVAL '13 hours'),
('São Paulo', 'BR', 25.5, 25.0, 58, 6.2, 'parcialmente nublado', NOW() - INTERVAL '12 hours'),
('São Paulo', 'BR', 24.0, 23.5, 62, 7.0, 'parcialmente nublado', NOW() - INTERVAL '11 hours'),
('São Paulo', 'BR', 22.5, 21.8, 66, 8.0, 'céu limpo', NOW() - INTERVAL '10 hours'),
('São Paulo', 'BR', 21.0, 20.2, 70, 9.5, 'céu limpo', NOW() - INTERVAL '9 hours'),
('São Paulo', 'BR', 19.8, 19.0, 73, 10.8, 'céu limpo', NOW() - INTERVAL '8 hours'),
('São Paulo', 'BR', 18.5, 17.5, 76, 11.5, 'céu limpo', NOW() - INTERVAL '7 hours'),
('São Paulo', 'BR', 17.5, 16.5, 78, 12.0, 'parcialmente nublado', NOW() - INTERVAL '6 hours'),
('São Paulo', 'BR', 17.0, 16.0, 80, 12.5, 'nublado', NOW() - INTERVAL '5 hours'),
('São Paulo', 'BR', 17.5, 16.5, 78, 12.0, 'nublado', NOW() - INTERVAL '4 hours'),
('São Paulo', 'BR', 18.2, 17.2, 75, 11.2, 'parcialmente nublado', NOW() - INTERVAL '3 hours'),
('São Paulo', 'BR', 19.0, 18.0, 72, 10.5, 'céu limpo', NOW() - INTERVAL '2 hours'),
('São Paulo', 'BR', 20.0, 19.0, 68, 9.8, 'céu limpo', NOW() - INTERVAL '1 hour'),
('São Paulo', 'BR', 21.0, 20.0, 65, 9.0, 'céu limpo', NOW());

-- Últimas 12 horas para Goiânia
INSERT INTO weather_records (city, country_code, temperature, feels_like, humidity, wind_speed, conditions, timestamp) VALUES
('Goiânia', 'BR', 22.0, 21.0, 55, 15.0, 'céu limpo', NOW() - INTERVAL '12 hours'),
('Goiânia', 'BR', 24.0, 23.0, 52, 14.0, 'céu limpo', NOW() - INTERVAL '11 hours'),
('Goiânia', 'BR', 26.5, 25.5, 48, 12.5, 'céu limpo', NOW() - INTERVAL '10 hours'),
('Goiânia', 'BR', 28.0, 27.0, 45, 11.0, 'parcialmente nublado', NOW() - INTERVAL '9 hours'),
('Goiânia', 'BR', 29.5, 28.5, 42, 10.0, 'parcialmente nublado', NOW() - INTERVAL '8 hours'),
('Goiânia', 'BR', 30.0, 29.0, 40, 9.5, 'céu limpo', NOW() - INTERVAL '7 hours'),
('Goiânia', 'BR', 29.5, 28.5, 42, 10.0, 'céu limpo', NOW() - INTERVAL '6 hours'),
('Goiânia', 'BR', 28.0, 27.0, 45, 11.5, 'parcialmente nublado', NOW() - INTERVAL '5 hours'),
('Goiânia', 'BR', 26.0, 25.0, 50, 13.0, 'nublado', NOW() - INTERVAL '4 hours'),
('Goiânia', 'BR', 24.5, 23.5, 52, 14.0, 'parcialmente nublado', NOW() - INTERVAL '3 hours'),
('Goiânia', 'BR', 23.0, 22.0, 55, 15.0, 'céu limpo', NOW() - INTERVAL '2 hours'),
('Goiânia', 'BR', 25.0, 24.0, 50, 13.5, 'céu limpo', NOW() - INTERVAL '1 hour'),
('Goiânia', 'BR', 27.0, 26.0, 47, 12.0, 'céu limpo', NOW());

-- Últimas 6 horas para Rio de Janeiro
INSERT INTO weather_records (city, country_code, temperature, feels_like, humidity, wind_speed, conditions, timestamp) VALUES
('Rio de Janeiro', 'BR', 24.0, 25.0, 80, 18.0, 'nublado', NOW() - INTERVAL '6 hours'),
('Rio de Janeiro', 'BR', 25.5, 26.5, 78, 17.0, 'parcialmente nublado', NOW() - INTERVAL '5 hours'),
('Rio de Janeiro', 'BR', 27.0, 28.0, 75, 16.0, 'céu limpo', NOW() - INTERVAL '4 hours'),
('Rio de Janeiro', 'BR', 28.0, 29.0, 73, 15.5, 'céu limpo', NOW() - INTERVAL '3 hours'),
('Rio de Janeiro', 'BR', 27.5, 28.5, 74, 16.0, 'parcialmente nublado', NOW() - INTERVAL '2 hours'),
('Rio de Janeiro', 'BR', 26.5, 27.5, 76, 17.0, 'nublado', NOW() - INTERVAL '1 hour'),
('Rio de Janeiro', 'BR', 26.0, 27.0, 77, 17.5, 'chuva leve', NOW());

-- Verificar dados inseridos
SELECT city, COUNT(*) as total_records,
       MIN(timestamp) as primeiro_registro,
       MAX(timestamp) as ultimo_registro
FROM weather_records
GROUP BY city
ORDER BY city;
