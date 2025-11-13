import { render, screen } from "@testing-library/react";

import App from "../App";

describe("App", () => {
  it("mostra a tela de login quando não autenticado", () => {
    localStorage.removeItem("monitoramento:user");
    render(<App />);
    expect(screen.getByText(/Monitoramento Ambiental/i)).toBeInTheDocument();
  });
});

