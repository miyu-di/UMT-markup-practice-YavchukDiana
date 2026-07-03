import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const itemsPerPage = 8;
const showMoreButtonDefaultLabel = "Show More";
const showMoreButtonLoadingLabel = "Loading...";

const bouquetList = document.getElementById("bouquet-list");
const showMoreButton = document.getElementById("show-more-btn");
const categoryFilter = document.getElementById("filter");

let activeCategory = categoryFilter?.value ?? "all";
let lastLoadedPage = 0;

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

function fillCatalogueListItem(listItem, flower) {
	const image = listItem.querySelector(".bouquet-img");
	image.src = flower.img;
	image.alt = flower.title;

	listItem.querySelector(".bouquet-name").textContent = flower.title;
	listItem.querySelector(".bouquet-price").textContent = formatPrice(flower.price);

	listItem.dataset.flowerId = String(flower.id ?? flower.title ?? "");
}

function renderCatalogueChunk(flowers, shouldReplaceList) {
	if (!bouquetList) return;

	if (shouldReplaceList) bouquetList.replaceChildren();

	const startIndex = bouquetList.children.length;
	const chunkMarkup = flowers.map(() => buildCatalogueListItemShellMarkup()).join("");
	bouquetList.insertAdjacentHTML("beforeend", chunkMarkup);

	const listItems = bouquetList.querySelectorAll(":scope > .bouquet-card");
	for (let i = 0; i < flowers.length; i += 1) {
		fillCatalogueListItem(listItems[startIndex + i], flowers[i]);
	}
}

async function fetchCataloguePage(page, options) {
	const { appendItems = false, showButtonLoader = false } = options;
	const isInitialChunk = !appendItems;

	if (showButtonLoader) setShowMoreButtonLoading(true);
	if (isInitialChunk && bouquetList) bouquetList.replaceChildren();

	try {
		const requestParams = {
			_page: page,
			_per_page: itemsPerPage,
		};

		if (activeCategory !== "all") {
			requestParams.category = activeCategory;
		}
		const response = await apiClient.get("/flowers", { params: requestParams });
		const responseBody = response.data;
		const flowers = Array.isArray(responseBody) ? responseBody : (responseBody?.data ?? []);

		if (appendItems && flowers.length > 0 && bouquetList) {
			const firstFlowerId = String(flowers[0].id ?? flowers[0].title ?? "");
			const isAlreadyRendered = bouquetList.querySelector(`[data-flower-id="${firstFlowerId}"]`);

			if (isAlreadyRendered) {
				if (showMoreButton) showMoreButton.classList.add("visually-hidden");
				return;
			}
		}

		if (flowers.length === 0 && isInitialChunk) {
			bouquetList.innerHTML = '<p class="empty-message">No bouquets available.</p>';
			if (showMoreButton) showMoreButton.classList.add("visually-hidden");
			return;
		}

		renderCatalogueChunk(flowers, !appendItems);
		lastLoadedPage = page;

		if (showMoreButton) {
			const hasNextPage =
				responseBody && typeof responseBody === "object" && responseBody.next !== undefined
					? responseBody.next !== null
					: true;

			const isLastPageByLength = flowers.length < itemsPerPage;

			if (!hasNextPage || isLastPageByLength) {
				showMoreButton.classList.add("visually-hidden");
			} else {
				showMoreButton.classList.remove("visually-hidden");
			}
		}
	} catch (error) {
		const msg = extractErrorMessage ? extractErrorMessage(error) : "Server error";
		if (showErrorNotification) showErrorNotification(msg);
		else console.error(error);
	} finally {
		if (showButtonLoader) setShowMoreButtonLoading(false);
	}
}

async function resetAndLoadFirstCataloguePage() {
	lastLoadedPage = 0;
	await fetchCataloguePage(1, { appendItems: false, showButtonLoader: false });
}

function handleFilterChange() {
	activeCategory = categoryFilter?.value;
	resetAndLoadFirstCataloguePage();
}

function handleShowMoreClick() {
	fetchCataloguePage(lastLoadedPage + 1, { appendItems: true, showButtonLoader: true });
}

function initCatalogueFromApi() {
	if (categoryFilter) categoryFilter.addEventListener("change", handleFilterChange);
	if (showMoreButton) showMoreButton.addEventListener("click", handleShowMoreClick);
	resetAndLoadFirstCataloguePage();
}

initCatalogueFromApi();
