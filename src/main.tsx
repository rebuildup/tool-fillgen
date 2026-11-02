import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FillgenApp from "./FillgenApp";

const container = document.getElementById("root");

if (!container) {
	throw new Error("Fillgen: missing #root element");
}

createRoot(container).render(
	<StrictMode>
		<FillgenApp />
	</StrictMode>,
);
