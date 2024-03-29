export * from "./faucetRequest";

export const serializeLd = (faqHeader: string): string =>
	`<script type="application/ld+json">${faqHeader}</script>`;
