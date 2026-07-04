import { apiClient } from "./apiClient.js";

let flowersPromise = null;
const flowersById = new Map();

async function fetchAllFlowers() {
	const response = await apiClient.get("/flowers");
	const body = response.data;
	return Array.isArray(body) ? body : (body?.data ?? []);
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
