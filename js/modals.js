import { getFlowerById, getAllFlowers } from "./flowersStore.js";
import { showErrorNotification } from "./notifications.js";

const productModal = document.querySelector(".product-modal");
const orderModal = document.querySelector(".order-modal");
const productBackdrop = productModal?.closest(".modal-backdrop");
const orderBackdrop = orderModal?.closest(".modal-backdrop");
const modalImg = document.querySelector(".product-modal-img");
const modalTitle = document.querySelector(".product-modal-title");
const modalPrice = document.querySelector(".product-modal-price");
const modalDesc = document.querySelector(".product-modal-desc");
const buyNowButton = document.querySelector(".product-modal-btn");
const quantityInput = document.getElementById("product-modal-quantity");

function openModal(backdrop) {
	if (!backdrop) return;
	backdrop.classList.add("is-open");
	document.body.style.overflow = "hidden";
}

function closeModal(backdrop) {
	if (!backdrop) return;
	backdrop.classList.remove("is-open");
	document.body.style.overflow = "";
}

function resetOrderForm() {
	const form = orderModal?.querySelector(".modal-form");
	if (form) form.reset();
}

async function handleFlowerCardClick(flowerId) {
	// getAllFlowers() тут майже завжди поверне вже готовий кеш миттєво —
	// await потрібен лише як підстраховка, якщо клік стався до першого рендеру
	await getAllFlowers();
	const flower = getFlowerById(flowerId);

	if (!flower) {
		if (showErrorNotification) showErrorNotification("Product not found");
		return;
	}

	if (modalImg) modalImg.src = flower.img || "";
	if (modalImg) modalImg.alt = flower.title || "Flower bouquet";
	if (modalTitle) modalTitle.textContent = flower.title || "No title";
	if (modalPrice) modalPrice.textContent = `$${flower.price || 0}`;
	if (modalDesc) modalDesc.textContent = flower.description || flower.desc || "No description available.";
	if (quantityInput) quantityInput.value = "1";

	openModal(productBackdrop);
}

document.addEventListener("click", (event) => {
	const flowerCard = event.target.closest("[data-flower-id]");
	if (!flowerCard || event.target.closest(".modal-backdrop")) return;
	const flowerId = flowerCard.dataset.flowerId;
	if (flowerId) {
		handleFlowerCardClick(flowerId);
	}
});

if (buyNowButton) {
	buyNowButton.addEventListener("click", () => {
		closeModal(productBackdrop);
		openModal(orderBackdrop);
	});
}

document.addEventListener("click", (event) => {
	if (event.target.closest("[data-modal-close]")) {
		const backdrop = event.target.closest(".modal-backdrop");
		closeModal(backdrop);
		if (backdrop === orderBackdrop) resetOrderForm();
		return;
	}
	if (event.target.classList.contains("modal-backdrop")) {
		closeModal(event.target);
		if (event.target === orderBackdrop) resetOrderForm();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		closeModal(productBackdrop);
		if (orderBackdrop?.classList.contains("is-open")) {
			closeModal(orderBackdrop);
			resetOrderForm();
		}
	}
});

const orderForm = orderModal?.querySelector(".modal-form");
if (orderForm) {
	orderForm.addEventListener("submit", (event) => {
		event.preventDefault();
		console.log("Форма замовлення відправлена!");
		closeModal(orderBackdrop);
		resetOrderForm();
	});
}
