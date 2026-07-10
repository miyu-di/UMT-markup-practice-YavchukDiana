import { apiClient } from "./apiClient.js";

let flowersPromise = null;
const flowersById = new Map();

async function fetchAllFlowers() {
	const response = await apiClient.get("/bouquets");
	const body = response.data;
	const flowers = Array.isArray(body) ? body : (body?.data ?? []);
	// Бекенд повертає поле photoURL, а розмітка (catalogue.js, bestsellers.js,
	// modals.js) очікує поле img — приводимо форму даних до старої форми.
	return flowers.map((flower) => ({ ...flower, img: flower.img ?? flower.photoURL }));
}

// Кешуємо проміс: скільки б модулів не викликали getAllFlowers() одночасно,
// реальний HTTP-запит піде лише один раз.
export function getAllFlowers() {
	if (!flowersPromise) {
		flowersPromise = fetchAllFlowers().then((flowers) => {
			flowers.forEach((flower, index) => {
				const key = String(flower.id ?? flower.title ?? index);
				flowersById.set(key, flower);
			});
			return flowers;
		});
	}
	return flowersPromise;
}

export function getFlowerById(flowerId) {
	return flowersById.get(String(flowerId));
}
