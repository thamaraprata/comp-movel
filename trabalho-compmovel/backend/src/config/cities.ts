export interface City {
  name: string;
  country: string;
  countryCode: string;
  state: string;
  description: string;
}

export const CITIES: City[] = [
  // Nordeste
  { name: "Salvador", country: "Brasil", countryCode: "BR", state: "BA", description: "Capital da Bahia" },
  { name: "Fortaleza", country: "Brasil", countryCode: "BR", state: "CE", description: "Capital do Ceará" },
  { name: "Recife", country: "Brasil", countryCode: "BR", state: "PE", description: "Veneza brasileira" },
  { name: "Maceió", country: "Brasil", countryCode: "BR", state: "AL", description: "Capital de Alagoas" },
  { name: "Teresina", country: "Brasil", countryCode: "BR", state: "PI", description: "Capital do Piauí" },
  { name: "São Luís", country: "Brasil", countryCode: "BR", state: "MA", description: "Capital do Maranhão" },
  { name: "Natal", country: "Brasil", countryCode: "BR", state: "RN", description: "Capital do Rio Grande do Norte" },
  { name: "João Pessoa", country: "Brasil", countryCode: "BR", state: "PB", description: "Capital da Paraíba" },
  { name: "Aracaju", country: "Brasil", countryCode: "BR", state: "SE", description: "Capital de Sergipe" },

  // Centro-Oeste
  { name: "Brasília", country: "Brasil", countryCode: "BR", state: "DF", description: "Capital federal" },
  { name: "Goiânia", country: "Brasil", countryCode: "BR", state: "GO", description: "Capital de Goiás" },
  { name: "Cuiabá", country: "Brasil", countryCode: "BR", state: "MT", description: "Capital do Mato Grosso" },
  { name: "Campo Grande", country: "Brasil", countryCode: "BR", state: "MS", description: "Capital do Mato Grosso do Sul" },

  // Norte
  { name: "Manaus", country: "Brasil", countryCode: "BR", state: "AM", description: "Porta da Amazônia" },
  { name: "Belém", country: "Brasil", countryCode: "BR", state: "PA", description: "Capital do Pará" },
  { name: "Boa Vista", country: "Brasil", countryCode: "BR", state: "RR", description: "Capital de Roraima" },
  { name: "Macapá", country: "Brasil", countryCode: "BR", state: "AP", description: "Capital do Amapá" },
  { name: "Palmas", country: "Brasil", countryCode: "BR", state: "TO", description: "Capital do Tocantins" },
  { name: "Porto Velho", country: "Brasil", countryCode: "BR", state: "RO", description: "Capital de Rondônia" },
  { name: "Rio Branco", country: "Brasil", countryCode: "BR", state: "AC", description: "Capital do Acre" },

  // Sudeste
  { name: "São Paulo", country: "Brasil", countryCode: "BR", state: "SP", description: "Maior metrópole do Brasil" },
  { name: "Rio de Janeiro", country: "Brasil", countryCode: "BR", state: "RJ", description: "A cidade maravilhosa" },
  { name: "Belo Horizonte", country: "Brasil", countryCode: "BR", state: "MG", description: "Cidade de Minas Gerais" },
  { name: "Vitória", country: "Brasil", countryCode: "BR", state: "ES", description: "Capital do Espírito Santo" },

  // Sul
  { name: "Curitiba", country: "Brasil", countryCode: "BR", state: "PR", description: "Modelo de planejamento urbano" },
  { name: "Porto Alegre", country: "Brasil", countryCode: "BR", state: "RS", description: "Capital do Rio Grande do Sul" },
  { name: "Florianópolis", country: "Brasil", countryCode: "BR", state: "SC", description: "Capital de Santa Catarina" }
];

export function getCityByName(name: string): City | undefined {
  return CITIES.find(city => city.name.toLowerCase() === name.toLowerCase());
}

export function getCityDescription(city: City): string {
  return `${city.name}, ${city.country}`;
}
