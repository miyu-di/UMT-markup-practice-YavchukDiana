import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";
import { getAllFlowers } from "./flowersStore.js";

const itemsPerPage = 8;
const showMoreButtonDefaultLabel = "Show More";
const showMoreButtonLoadingLabel = "Loading...";

const bouquetList = document.getElementById("bouquet-list");
const showMoreButton = document.getElementById("show-more-btn");
const categoryFilter = document.getElementById("filter");

let activeCategory = categoryFilter?.value ?? "all";
let renderedCount = 0;
let filteredFlowers = [];

function setShowMoreButtonLoading(isLoading) {
	if (!showMoreButton) return;
	showMoreButton.disabled = isLoading;
	showMoreButton.textContent = isLoading ? showMoreButtonLoadingLabel : showMoreButtonDefaultLabel;
}

function formatPrice(priceDigits) {
	if (!priceDigits) return "-";
	return `$${priceDigits}`;
}

function buildCatalogueListItemShellMarkup() {
	return `
    <li class="bouquet-card">
        <img class="bouquet-img" src="" alt="" />
        <h3 class="bouquet-name"></h3>
        <p class="bouquet-price"></p>
    </li>
    `;
}

function fillCatalogueListItem(listItem, flower, index) {
	const image = listItem.querySelector(".bouquet-img");
	image.src = flower.img;
	image.alt = flower.title;

	listItem.querySelector(".bouquet-name").textContent = flower.title;
	listItem.querySelector(".bouquet-price").textContent = formatPrice(flower.price);

	listItem.dataset.flowerId = String(flower.id ?? flower.title ?? index);
}

function updateShowMoreVisibility() {
	if (!showMoreButton) return;
	if (renderedCount >= filteredFlowers.length) {
		showMoreButton.classList.add("visually-hidden");
	} else {
		showMoreButton.classList.remove("visually-hidden");
	}
}

function renderNextChunk(shouldReplaceList) {
	if (!bouquetList) return;

	if (shouldReplaceList) {
		bouquetList.replaceChildren();
		renderedCount = 0;
	}

	const nextChunk = filteredFlowers.slice(renderedCount, renderedCount + itemsPerPage);

	if (nextChunk.length === 0 && renderedCount === 0) {
		bouquetList.innerHTML = '<p class="empty-message">No bouquets available.</p>';
		if (showMoreButton) showMoreButton.classList.add("visually-hidden");
		return;
	}

	const chunkMarkup = nextChunk.map(() => buildCatalogueListItemShellMarkup()).join("");
	bouquetList.insertAdjacentHTML("beforeend", chunkMarkup);

	const listItems = bouquetList.querySelectorAll(":scope > .bouquet-card");
	nextChunk.forEach((flower, i) => {
		fillCatalogueListItem(listItems[renderedCount + i], flower, renderedCount + i);
	});

	renderedCount += nextChunk.length;
	updateShowMoreVisibility();
}

async function loadCatalogue() {
	try {
		const allFlowers = await getAllFlowers();
		filteredFlowers =
			activeCategory === "all" ? allFlowers : allFlowers.filter((flower) => flower.category === activeCategory);
		renderNextChunk(true);
	} catch (error) {
		const msg = extractErrorMessage ? extractErrorMessage(error) : "Server error";
		if (showErrorNotification) showErrorNotification(msg);
		else console.error(error);
	}
}

function handleFilterChange() {
	activeCategory = categoryFilter?.value ?? "all";
	loadCatalogue();
}

function handleShowMoreClick() {
	setShowMoreButtonLoading(true);
	renderNextChunk(false);
	setShowMoreButtonLoading(false);
}

function initCatalogueFromApi() {
	if (categoryFilter) categoryFilter.addEventListener("change", handleFilterChange);
	if (showMoreButton) showMoreButton.addEventListener("click", handleShowMoreClick);
	loadCatalogue();
}

initCatalogueFromApi();
