import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const bestsellersPerPage = 3;

const bestsellersList = document.getElementById("bestsellers-list");
const dotsContainer = document.getElementById("bestsellers-dots");
const prevButton = document.getElementById("bestsellers-prev");
const nextButton = document.getElementById("bestsellers-next");

let currentPage = 1;
let totalPages = 1;

function formatPrice(priceDigits) {
	if (!priceDigits) return "-";
	return `$${priceDigits}`;
}

function renderDots() {
	if (!dotsContainer) return;
	dotsContainer.replaceChildren();

	const dotsMarkup = Array.from({ length: totalPages })
		.map((_, index) => {
			const pageNumber = index + 1;
			const activeClass = pageNumber === currentPage ? " active" : "";
			return `<li class="dot${activeClass}" data-page="${pageNumber}"></li>`;
		})
		.join("");

	dotsContainer.insertAdjacentHTML("beforeend", dotsMarkup);
}

function updateArrowsState() {
	if (prevButton) prevButton.disabled = currentPage <= 1;
	if (nextButton) nextButton.disabled = currentPage >= totalPages;
}

function buildTopItemMarkup() {
	return `
    <li class="card">
        <img class="selling-img" src="" alt="" />
        <h3 class="card-title"></h3>
        <p class="card-price"></p>
    </li>
    `;
}

function fillTopListItem(listItem, flower) {
	const image = listItem.querySelector(".selling-img");
	if (image) {
		image.src = flower.img;
		image.alt = flower.title;
	}

	const titleEl = listItem.querySelector(".card-title");
	if (titleEl) titleEl.textContent = flower.title;

	const priceEl = listItem.querySelector(".card-price");
	if (priceEl) priceEl.textContent = formatPrice(flower.price);

	listItem.dataset.flowerId = String(flower.id ?? flower.title ?? "");
}

function renderBestsellersChunk(flowers) {
	if (!bestsellersList) return;
	bestsellersList.replaceChildren();

	const chunkMarkup = flowers.map(() => buildTopItemMarkup()).join("");
	bestsellersList.insertAdjacentHTML("beforeend", chunkMarkup);

	const listItems = bestsellersList.querySelectorAll(":scope > .card");
	flowers.forEach((flower, i) => {
		if (listItems[i]) fillTopListItem(listItems[i], flower);
	});
}

async function fetchBestsellersPage(page) {
	if (!bestsellersList) return;

	try {
		bestsellersList.classList.add("loading");

		const response = await apiClient.get("/flowers", {
			params: {
				_page: page,
				_per_page: bestsellersPerPage,
				category: "top",
			},
		});

		const responseBody = response.data;
		const flowers = Array.isArray(responseBody) ? responseBody : (responseBody?.data ?? []);

		totalPages =
			responseBody?.pages ??
			Math.max(1, Math.ceil(Number(response.headers["x-total-count"] || 0) / bestsellersPerPage));
		currentPage = page;

		await new Promise((resolve) => setTimeout(resolve, 200));

		renderBestsellersChunk(flowers);
		renderDots();
		updateArrowsState();
	} catch (error) {
		const msg = extractErrorMessage ? extractErrorMessage(error) : "Server error";
		if (showErrorNotification) showErrorNotification(msg);
		else console.error(error);
	} finally {
		bestsellersList.classList.remove("loading");
	}
}

function handleDotClick(event) {
	const dot = event.target.closest(".dot");
	if (!dot) return;
	const page = Number(dot.dataset.page);
	if (page && page !== currentPage) fetchBestsellersPage(page);
}

function handlePrevClick() {
	if (currentPage > 1) fetchBestsellersPage(currentPage - 1);
}

function handleNextClick() {
	if (currentPage < totalPages) fetchBestsellersPage(currentPage + 1);
}

function initBestsellers() {
	if (!bestsellersList) return;
	if (dotsContainer) dotsContainer.addEventListener("click", handleDotClick);
	if (prevButton) prevButton.addEventListener("click", handlePrevClick);
	if (nextButton) nextButton.addEventListener("click", handleNextClick);

	fetchBestsellersPage(1);
}

initBestsellers();
